/*
Copyright IBM Corp. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/

package chaincode

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

const presCollection = "presCollection"
const transferAgreementObjectType = "transferAgreement"

// SmartContract of this fabric sample
type SmartContract struct {
	contractapi.Contract
}

// Asset describes main asset details that are visible to all organizations
type Prescription struct {
	Type       string `json:"objectType"` //Type is used to distinguish the various types of objects in state database
	ID         string `json:"id"`
	PID        string `json: "pid"`
	DocID      string `json: "did"`
	Owner      string `json: "owner"`
	Name       string `json:"name"`
	DoctorName string `json:"doctorname"`
	Age        string `json:"age"`
	Date       string `json:"date"`
	Symtomp    string `json:"symtomp"`
	Disease    string `json:"disease"`
}

// AssetPrivateDetails describes details that are private to owners
type PrescriptionPrivateDetails struct {
	ID        string `json:"id"`
	Medicine  string `json:"medicine"`
	TxId      string `json:"txid"`
	Available int    `json:"available"` //available days
}

// Transfer prescription describes the doctor agreement returned by ReadTransferAgreement
type TransferAgreement struct {
	ID             string `json:"id"`
	RequestedDocID string `json:"requestedDocID"`
}

// CreateAsset creates a new asset by placing the main asset details in the presCollection
// that can be read by both organizations. The appraisal value is stored in the owners org specific collection.
func (s *SmartContract) CreatePrescription(ctx contractapi.TransactionContextInterface) error {

	transientMap, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("error getting transient: %v", err)
	}

	// Asset properties are private, therefore they get passed in transient field, instead of func args
	transientAssetJSON, ok := transientMap["asset_properties"]
	if !ok {
		//log error to stdout
		return fmt.Errorf("prescription not found in the transient map input")
	}

	type PrescriptionTransientInput struct {
		Type       string `json:"objectType"`
		ID         string `json:"id"`
		PID        string `json: "pid"`
		DocID      string `json: "did"`
		Name       string `json:"name"`
		DoctorName string `json:"doctorname"`
		Age        string `json:"age"`
		Date       string `json:"date"`
		Symtomp    string `json:"symtomp"`
		Disease    string `json:"disease"`
		Medicine   string `json:"medicine"`
		Available  int    `json:"available"`
	}

	var prescriptionInput PrescriptionTransientInput
	err = json.Unmarshal(transientAssetJSON, &prescriptionInput)
	if err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %v", err)
	}

	if len(prescriptionInput.Type) == 0 {
		return fmt.Errorf("objectType field must be a non-empty string")
	}
	if len(prescriptionInput.ID) == 0 {
		return fmt.Errorf("prescriptionID field must be a non-empty string")
	}
	if len(prescriptionInput.PID) == 0 {
		return fmt.Errorf("patient id field must be a non-empty string")
	}
	if len(prescriptionInput.DocID) == 0 {
		return fmt.Errorf("docotr's id field must be a non-empty string")
	}
	if len(prescriptionInput.DoctorName) == 0 {
		return fmt.Errorf("doctor id field must be a non-empty string")
	}
	if len(prescriptionInput.Name) == 0 {
		return fmt.Errorf("Name field must be a non-empty string")
	}
	if len(prescriptionInput.Age) == 0 {
		return fmt.Errorf("Age field must be a non-empty string")
	}
	if len(prescriptionInput.Date) == 0 {
		return fmt.Errorf("Date field must be a non-empty string")
	}
	if len(prescriptionInput.Symtomp) == 0 {
		return fmt.Errorf("Symtomp field must be a non-empty string")
	}
	if len(prescriptionInput.Disease) == 0 {
		return fmt.Errorf("Disease field must be a non-empty string")
	}
	if len(prescriptionInput.Medicine) == 0 {
		return fmt.Errorf("Medicine field must be a non-empty string")
	}
	if prescriptionInput.Available <= 0 {
		return fmt.Errorf("Available field must be a non-empty string")
	}

	// Check if asset already exists
	prescriptionAsBytes, err := ctx.GetStub().GetPrivateData(presCollection, prescriptionInput.ID)
	if err != nil {
		return fmt.Errorf("failed to get prescription: %v", err)
	} else if prescriptionAsBytes != nil {
		fmt.Println("prescription already exists: " + prescriptionInput.ID)
		return fmt.Errorf("this prescription already exists: " + prescriptionInput.ID)
	}

	// Get ID of submitting client identity
	clientID, err := submittingClientIdentity(ctx)
	if err != nil {
		return err
	}

	// Verify that the client is submitting request to peer in their organization
	// This is to ensure that a client from another org doesn't attempt to read or
	// write private data from this peer.
	err = verifyClientOrgMatchesPeerOrg(ctx)
	if err != nil {
		return fmt.Errorf("Createprescription cannot be performed: Error %v", err)
	}

	// Make submitting client the owner
	txid := ctx.GetStub().GetTxID()
	prescription := Prescription{
		Type:       prescriptionInput.Type,
		ID:         prescriptionInput.ID,
		PID:        prescriptionInput.PID,
		DocID:      prescriptionInput.DocID,
		Owner:      clientID,
		Name:       prescriptionInput.Name,
		DoctorName: prescriptionInput.DoctorName,
		Age:        prescriptionInput.Age,
		Date:       prescriptionInput.Date,
		Symtomp:    prescriptionInput.Symtomp,
		Disease:    prescriptionInput.Disease,
	}
	presJSONasBytes, err := json.Marshal(prescription)
	if err != nil {
		return fmt.Errorf("failed to marshal prescription into JSON: %v", err)
	}

	// Save asset to private data collection
	// Typical logger, logs to stdout/file in the fabric managed docker container, running this chaincode
	// Look for container name like dev-peer0.org1.example.com-{chaincodename_version}-xyz
	log.Printf("CreateAsset Put: collection %v, ID %v, owner %v", presCollection, prescriptionInput.ID, clientID)

	err = ctx.GetStub().PutPrivateData(presCollection, prescriptionInput.ID, presJSONasBytes)
	if err != nil {
		return fmt.Errorf("failed to put asset into private data collecton: %v", err)
	}

	// Save asset details to collection visible to owning organization
	prescriptionPrivateDetails := PrescriptionPrivateDetails{
		ID:        prescriptionInput.ID,
		Medicine:  prescriptionInput.Medicine,
		TxId:      txid,
		Available: prescriptionInput.Available,
	}

	PrescriptionPrivateDetailsAsBytes, err := json.Marshal(prescriptionPrivateDetails) // marshal asset details to JSON
	if err != nil {
		return fmt.Errorf("failed to marshal into JSON: %v", err)
	}

	// Get collection name for this organization.
	orgCollection, err := getCollectionName(ctx)
	if err != nil {
		return fmt.Errorf("failed to infer private collection name for the org: %v", err)
	}

	// Put asset Available value into owners org specific private data collection
	log.Printf("Put: collection %v, ID %v", orgCollection, prescriptionInput.ID)
	err = ctx.GetStub().PutPrivateData(orgCollection, prescriptionInput.ID, PrescriptionPrivateDetailsAsBytes)
	if err != nil {
		return fmt.Errorf("failed to put asset private details: %v", err)
	}
	return nil
}

// AgreeToTransfer is used by the potential buyer of the asset to agree to the
// asset value. The agreed to appraisal value is stored in the buying orgs
// org specifc collection, while the the buyer client ID is stored in the asset collection
// using a composite key
func (s *SmartContract) AgreeToTransfer(ctx contractapi.TransactionContextInterface) error {

	// Get ID of submitting client identity
	clientID, err := submittingClientIdentity(ctx)
	if err != nil {
		return err
	}

	// Value is private, therefore it gets passed in transient field
	transientMap, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("error getting transient: %v", err)
	}

	// Persist the JSON bytes as-is so that there is no risk of nondeterministic marshaling.
	valueJSONasBytes, ok := transientMap["asset_value"]
	if !ok {
		return fmt.Errorf("asset_value key not found in the transient map")
	}

	// Unmarshal the tranisent map to get the asset ID.
	var valueJSON PrescriptionPrivateDetails
	err = json.Unmarshal(valueJSONasBytes, &valueJSON)
	if err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %v", err)
	}

	// Do some error checking since we get the chance
	if len(valueJSON.ID) == 0 {
		return fmt.Errorf("assetID field must be a non-empty string")
	}
	if len(valueJSON.Medicine) == 0 {
		return fmt.Errorf("Medicine field must be a non-empty string")
	}
	if len(valueJSON.TxId) == 0 {
		return fmt.Errorf("TxId field must be a non-empty string")
	}
	if valueJSON.Available <= 0 {
		return fmt.Errorf("AvailableValue field must be a positive integer")
	}

	// Read prescription from the private data collection
	prescription, err := s.ReadPrescription(ctx, valueJSON.ID)
	if err != nil {
		return fmt.Errorf("error reading asset: %v", err)
	}
	if prescription == nil {
		return fmt.Errorf("%v does not exist", valueJSON.ID)
	}
	// Verify that the client is submitting request to peer in their organization
	err = verifyClientOrgMatchesPeerOrg(ctx)
	if err != nil {
		return fmt.Errorf("AgreeToTransfer cannot be performed: Error %v", err)
	}

	// Get collection name for this organization. Needs to be read by a member of the organization.
	orgCollection, err := getCollectionName(ctx)
	if err != nil {
		return fmt.Errorf("failed to infer private collection name for the org: %v", err)
	}

	log.Printf("AgreeToTransfer Put: collection %v, ID %v", orgCollection, valueJSON.ID)
	// Put agreed value in the org specifc private data collection
	err = ctx.GetStub().PutPrivateData(orgCollection, valueJSON.ID, valueJSONasBytes)
	if err != nil {
		return fmt.Errorf("failed to put asset bid: %v", err)
	}

	// Create agreeement that indicates which identity has agreed to purchase
	// In a more realistic transfer scenario, a transfer agreement would be secured to ensure that it cannot
	// be overwritten by another channel member
	transferAgreeKey, err := ctx.GetStub().CreateCompositeKey(transferAgreementObjectType, []string{valueJSON.ID})
	if err != nil {
		return fmt.Errorf("failed to create composite key: %v", err)
	}

	log.Printf("AgreeToTransfer Put: collection %v, ID %v, Key %v", presCollection, valueJSON.ID, transferAgreeKey)
	err = ctx.GetStub().PutPrivateData(presCollection, transferAgreeKey, []byte(clientID))
	if err != nil {
		return fmt.Errorf("failed to put asset bid: %v", err)
	}

	return nil
}

// TransferAsset transfers the asset to the new owner by setting a new owner ID
func (s *SmartContract) TransferAsset(ctx contractapi.TransactionContextInterface) error {

	transientMap, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("error getting transient %v", err)
	}

	// Asset properties are private, therefore they get passed in transient field
	transientTransferJSON, ok := transientMap["asset_owner"]
	if !ok {
		return fmt.Errorf("asset owner not found in the transient map")
	}

	type prescriptionTransferTransientInput struct {
		ID           string `json:"id"`
		RequestedMSP string `json:"requestedMSP"`
	}

	var prescriptionTransferInput prescriptionTransferTransientInput
	err = json.Unmarshal(transientTransferJSON, &prescriptionTransferInput)
	if err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %v", err)
	}

	if len(prescriptionTransferInput.ID) == 0 {
		return fmt.Errorf("assetID field must be a non-empty string")
	}
	if len(prescriptionTransferInput.RequestedMSP) == 0 {
		return fmt.Errorf("Requested Doctor id field must be a non-empty string")
	}
	log.Printf("TransferAsset: verify prescription exists ID %v", prescriptionTransferInput.ID)
	// Read asset from the private data collection
	prescription, err := s.ReadPrescription(ctx, prescriptionTransferInput.ID)
	if err != nil {
		return fmt.Errorf("error reading asset: %v", err)
	}
	if prescription == nil {
		return fmt.Errorf("%v does not exist", prescriptionTransferInput.ID)
	}
	// Verify that the client is submitting request to peer in their organization
	err = verifyClientOrgMatchesPeerOrg(ctx)
	if err != nil {
		return fmt.Errorf("TransferAsset cannot be performed: Error %v", err)
	}

	// Verify transfer details and transfer owner
	err = s.verifyAgreement(ctx, prescriptionTransferInput.ID, prescription.Owner, prescriptionTransferInput.RequestedMSP)
	if err != nil {
		return fmt.Errorf("failed transfer verification: %v", err)
	}

	transferAgreement, err := s.ReadTransferAgreement(ctx, prescriptionTransferInput.ID)
	if err != nil {
		return fmt.Errorf("failed ReadTransferAgreement to find buyerID: %v", err)
	}
	if transferAgreement.RequestedDocID == "" {
		return fmt.Errorf("Requested ID not found in TransferAgreement for %v", prescriptionTransferInput.ID)
	}

	// Transfer asset in private data collection to new owner
	prescription.Owner = transferAgreement.RequestedDocID

	presJSONasBytes, err := json.Marshal(prescription)
	if err != nil {
		return fmt.Errorf("failed marshalling asset %v: %v", prescriptionTransferInput.ID, err)
	}

	log.Printf("TransferAsset Put: collection %v, ID %v", presCollection, prescriptionTransferInput.ID)
	err = ctx.GetStub().PutPrivateData(presCollection, prescriptionTransferInput.ID, presJSONasBytes) //rewrite the asset
	if err != nil {
		return err
	}

	// Get collection name for this organization
	ownersCollection, err := getCollectionName(ctx)
	if err != nil {
		return fmt.Errorf("failed to infer private collection name for the org: %v", err)
	}

	// Delete the asset Available value from this organization's private data collection
	err = ctx.GetStub().DelPrivateData(ownersCollection, prescriptionTransferInput.ID)
	if err != nil {
		return err
	}

	// Delete the transfer agreement from the asset collection
	transferAgreeKey, err := ctx.GetStub().CreateCompositeKey(transferAgreementObjectType, []string{prescriptionTransferInput.ID})
	if err != nil {
		return fmt.Errorf("failed to create composite key: %v", err)
	}

	err = ctx.GetStub().DelPrivateData(presCollection, transferAgreeKey)
	if err != nil {
		return err
	}

	return nil

}

// verifyAgreement is an internal helper function used by TransferAsset to verify
// that the transfer is being initiated by the owner and that the buyer has agreed
// to the same appraisal value as the owner
func (s *SmartContract) verifyAgreement(ctx contractapi.TransactionContextInterface, prescriptionID string, owner string, reqDocMSP string) error {

	// Check 1: verify that the transfer is being initiatied by the owner

	// Get ID of submitting client identity
	clientID, err := submittingClientIdentity(ctx)
	if err != nil {
		return err
	}

	if clientID != owner {
		return fmt.Errorf("error: submitting client identity does not own prescription")
	}

	// Check 2: verify that the buyer has agreed to the Available value

	// Get collection names
	collectionOwner, err := getCollectionName(ctx) // get owner collection from caller identity
	if err != nil {
		return fmt.Errorf("failed to infer private collection name for the org: %v", err)
	}

	collectionBuyer := reqDocMSP + "PrivateCollection" // get buyers collection

	// Get hash of owners agreed to value
	ownerAvailableValueHash, err := ctx.GetStub().GetPrivateDataHash(collectionOwner, prescriptionID)
	if err != nil {
		return fmt.Errorf("failed to get hash of Available value from owners collection %v: %v", collectionOwner, err)
	}
	if ownerAvailableValueHash == nil {
		return fmt.Errorf("hash of Available value for %v does not exist in collection %v", prescriptionID, collectionOwner)
	}

	// Get hash of buyers agreed to value
	buyerAvailableValueHash, err := ctx.GetStub().GetPrivateDataHash(collectionBuyer, prescriptionID)
	if err != nil {
		return fmt.Errorf("failed to get hash of Available value from buyer collection %v: %v", collectionBuyer, err)
	}
	if buyerAvailableValueHash == nil {
		return fmt.Errorf("hash of Available value for %v does not exist in collection %v. AgreeToTransfer must be called by the buyer first", prescriptionID, collectionBuyer)
	}

	// Verify that the two hashes match
	if !bytes.Equal(ownerAvailableValueHash, buyerAvailableValueHash) {
		return fmt.Errorf("hash for Available value for owner %x does not value for seller %x", ownerAvailableValueHash, buyerAvailableValueHash)
	}

	return nil
}

// DeleteAsset can be used by the owner of the asset to delete the asset
func (s *SmartContract) DeleteAsset(ctx contractapi.TransactionContextInterface) error {

	transientMap, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("Error getting transient: %v", err)
	}

	// Asset properties are private, therefore they get passed in transient field
	transientDeleteJSON, ok := transientMap["asset_delete"]
	if !ok {
		return fmt.Errorf("prescription to delete not found in the transient map")
	}

	type prescriptionDelete struct {
		ID string `json:"dataID"`
	}

	var prescriptionDeleteInput prescriptionDelete
	err = json.Unmarshal(transientDeleteJSON, &prescriptionDeleteInput)
	if err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %v", err)
	}

	if len(prescriptionDeleteInput.ID) == 0 {
		return fmt.Errorf("dataID field must be a non-empty string")
	}

	// Verify that the client is submitting request to peer in their organization
	err = verifyClientOrgMatchesPeerOrg(ctx)
	if err != nil {
		return fmt.Errorf("DeleteAsset cannot be performed: Error %v", err)
	}

	log.Printf("Deleting Asset: %v", prescriptionDeleteInput.ID)
	valAsbytes, err := ctx.GetStub().GetPrivateData(presCollection, prescriptionDeleteInput.ID) //get the asset from chaincode state
	if err != nil {
		return fmt.Errorf("failed to read prescription: %v", err)
	}
	if valAsbytes == nil {
		return fmt.Errorf("prescription not found: %v", prescriptionDeleteInput.ID)
	}

	ownerCollection, err := getCollectionName(ctx) // Get owners collection
	if err != nil {
		return fmt.Errorf("failed to infer private collection name for the org: %v", err)
	}

	//check the asset is in the caller org's private collection
	valAsbytes, err = ctx.GetStub().GetPrivateData(ownerCollection, prescriptionDeleteInput.ID)
	if err != nil {
		return fmt.Errorf("failed to read prescription from owner's Collection: %v", err)
	}
	if valAsbytes == nil {
		return fmt.Errorf("prescription not found in owner's private Collection %v: %v", ownerCollection, prescriptionDeleteInput.ID)
	}

	// delete the asset from state
	err = ctx.GetStub().DelPrivateData(presCollection, prescriptionDeleteInput.ID)
	if err != nil {
		return fmt.Errorf("failed to delete state: %v", err)
	}

	// Finally, delete private details of asset
	err = ctx.GetStub().DelPrivateData(ownerCollection, prescriptionDeleteInput.ID)
	if err != nil {
		return err
	}

	return nil

}

// DeleteTranferAgreement can be used by the buyer to withdraw a proposal from
// the asset collection and from his own collection.
func (s *SmartContract) DeleteTranferAgreement(ctx contractapi.TransactionContextInterface) error {

	transientMap, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("error getting transient: %v", err)
	}

	// Asset properties are private, therefore they get passed in transient field
	transientDeleteJSON, ok := transientMap["agreement_delete"]
	if !ok {
		return fmt.Errorf("prescription to delete not found in the transient map")
	}

	type prescriptionDelete struct {
		ID string `json:"prescriptionID"`
	}

	var prescriptionDeleteInput prescriptionDelete
	err = json.Unmarshal(transientDeleteJSON, &prescriptionDeleteInput)
	if err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %v", err)
	}

	if len(prescriptionDeleteInput.ID) == 0 {
		return fmt.Errorf("transient input ID field must be a non-empty string")
	}

	// Verify that the client is submitting request to peer in their organization
	err = verifyClientOrgMatchesPeerOrg(ctx)
	if err != nil {
		return fmt.Errorf("DeleteTranferAgreement cannot be performed: Error %v", err)
	}
	// Delete private details of agreement
	orgCollection, err := getCollectionName(ctx) // Get proposers collection.
	if err != nil {
		return fmt.Errorf("failed to infer private collection name for the org: %v", err)
	}
	tranferAgreeKey, err := ctx.GetStub().CreateCompositeKey(transferAgreementObjectType, []string{prescriptionDeleteInput.
		ID}) // Create composite key
	if err != nil {
		return fmt.Errorf("failed to create composite key: %v", err)
	}

	valAsbytes, err := ctx.GetStub().GetPrivateData(presCollection, tranferAgreeKey) //get the transfer_agreement
	if err != nil {
		return fmt.Errorf("failed to read transfer_agreement: %v", err)
	}
	if valAsbytes == nil {
		return fmt.Errorf("asset's transfer_agreement does not exist: %v", prescriptionDeleteInput.ID)
	}

	log.Printf("Deleting TranferAgreement: %v", prescriptionDeleteInput.ID)
	err = ctx.GetStub().DelPrivateData(orgCollection, prescriptionDeleteInput.ID) // Delete the asset
	if err != nil {
		return err
	}

	// Delete transfer agreement record
	err = ctx.GetStub().DelPrivateData(presCollection, tranferAgreeKey) // remove agreement from state
	if err != nil {
		return err
	}

	return nil

}

// getCollectionName is an internal helper function to get collection of submitting client identity.
func getCollectionName(ctx contractapi.TransactionContextInterface) (string, error) {

	// Get the MSP ID of submitting client identity
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return "", fmt.Errorf("failed to get verified MSPID: %v", err)
	}

	// Create the collection name
	orgCollection := clientMSPID + "PrivateCollection"

	return orgCollection, nil
}

// verifyClientOrgMatchesPeerOrg is an internal function used verify client org id and matches peer org id.
func verifyClientOrgMatchesPeerOrg(ctx contractapi.TransactionContextInterface) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed getting the client's MSPID: %v", err)
	}
	peerMSPID, err := shim.GetMSPID()
	if err != nil {
		return fmt.Errorf("failed getting the peer's MSPID: %v", err)
	}

	if clientMSPID != peerMSPID {
		return fmt.Errorf("client from org %v is not authorized to read or write private data from an org %v peer", clientMSPID, peerMSPID)
	}

	return nil
}

func submittingClientIdentity(ctx contractapi.TransactionContextInterface) (string, error) {
	b64ID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return "", fmt.Errorf("Failed to read clientID: %v", err)
	}
	decodeID, err := base64.StdEncoding.DecodeString(b64ID)
	if err != nil {
		return "", fmt.Errorf("failed to base64 decode clientID: %v", err)
	}
	return string(decodeID), nil
}
