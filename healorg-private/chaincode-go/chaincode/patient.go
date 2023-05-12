/*
Author - Mallika Dey
*/

package chaincode

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// Asset describes main asset details that are visible to all organizations
type User struct {
	Type     string `json:"objectType"`
	ID       string `json:"id"`
	Name     string `json:"name"`
	Gender   string `json:"gender"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Salt     string `json:"salt"`
	PhoneNo  string `json:"phoneno"`
	UserType string `json:"usertype"`
	Creator  string `json:"creator"`
}

// CreateAsset creates a new asset by placing the main asset details in the presCollection
// that can be read by both organizations. The appraisal value is stored in the owners org specific collection.
func (s *SmartContract) CreateUser(ctx contractapi.TransactionContextInterface) error {

	transientMap, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("error getting transient: %v", err)
	}

	transientAssetJSON, ok := transientMap["asset_properties"]
	if !ok {
		return fmt.Errorf("user not found in the transient map input")
	}

	type UserTransientInput struct {
		Type     string `json:"objectType"`
		ID       string `json:"id"`
		Name     string `json:"name"`
		Gender   string `json:"gender"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Salt     string `json:"salt"`
		PhoneNo  string `json:"phoneno"`
		UserType string `json:"usertype"`
	}

	var userInput UserTransientInput
	err = json.Unmarshal(transientAssetJSON, &userInput)
	if err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %v", err)
	}

	if len(userInput.Type) == 0 {
		return fmt.Errorf("objectType field must be a non-empty string")
	}
	if len(userInput.ID) == 0 {
		return fmt.Errorf("userID field must be a non-empty string")
	}
	if len(userInput.Name) == 0 {
		return fmt.Errorf("Name field must be a non-empty string")
	}
	if len(userInput.Gender) == 0 {
		return fmt.Errorf("Gender field must be a non-empty string")
	}
	if len(userInput.Email) == 0 {
		return fmt.Errorf("Email field must be a non-empty string")
	}
	if len(userInput.Password) == 0 {
		return fmt.Errorf("Password field must be a non-empty string")
	}
	if len(userInput.Salt) == 0 {
		return fmt.Errorf("Salt field must be a non-empty string")
	}
	if len(userInput.PhoneNo) == 0 {
		return fmt.Errorf("PhoneNo field must be a non-empty string")
	}
	if len(userInput.UserType) == 0 {
		return fmt.Errorf("UserType field must be a non-empty string")
	}

	// Check if asset already exists
	userAsBytes, err := ctx.GetStub().GetPrivateData(presCollection, userInput.ID)
	if err != nil {
		return fmt.Errorf("failed to get user: %v", err)
	} else if userAsBytes != nil {
		fmt.Println("user already exists: " + userInput.ID)
		return fmt.Errorf("this user already exists: " + userInput.ID)
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
		return fmt.Errorf("Createuser cannot be performed: Error %v", err)
	}

	// Make submitting client the owner
	user := User{
		Type:     userInput.Type,
		ID:       userInput.ID,
		Name:     userInput.Name,
		Gender:   userInput.Gender,
		Email:    userInput.Email,
		Password: userInput.Password,
		Salt:     userInput.Salt,
		PhoneNo:  userInput.PhoneNo,
		UserType: userInput.UserType,
		Creator:  clientID,
	}
	presJSONasBytes, err := json.Marshal(user)
	if err != nil {
		return fmt.Errorf("failed to marshal user into JSON: %v", err)
	}

	err = ctx.GetStub().PutPrivateData(presCollection, userInput.ID, presJSONasBytes)
	if err != nil {
		return fmt.Errorf("failed to put asset into private data collecton: %v", err)
	}

	return nil
}

// DeleteAsset can be used by the owner of the asset to delete the asset
func (s *SmartContract) DeleteUser(ctx contractapi.TransactionContextInterface) error {

	transientMap, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("Error getting transient: %v", err)
	}

	// Asset properties are private, therefore they get passed in transient field
	transientDeleteJSON, ok := transientMap["asset_delete"]
	if !ok {
		return fmt.Errorf("user to delete not found in the transient map")
	}

	type userDelete struct {
		ID string `json:"userID"`
	}

	var userDeleteInput userDelete
	err = json.Unmarshal(transientDeleteJSON, &userDeleteInput)
	if err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %v", err)
	}

	if len(userDeleteInput.ID) == 0 {
		return fmt.Errorf("userID field must be a non-empty string")
	}

	// Verify that the client is submitting request to peer in their organization
	err = verifyClientOrgMatchesPeerOrg(ctx)
	if err != nil {
		return fmt.Errorf("DeleteAsset cannot be performed: Error %v", err)
	}

	log.Printf("Deleting Asset: %v", userDeleteInput.ID)
	valAsbytes, err := ctx.GetStub().GetPrivateData(presCollection, userDeleteInput.ID) //get the asset from chaincode state
	if err != nil {
		return fmt.Errorf("failed to read user: %v", err)
	}
	if valAsbytes == nil {
		return fmt.Errorf("user not found: %v", userDeleteInput.ID)
	}

	err = ctx.GetStub().DelPrivateData(presCollection, userDeleteInput.ID)
	if err != nil {
		return fmt.Errorf("failed to delete state: %v", err)
	}

	return nil

}

func (s *SmartContract) UpdateUser(ctx contractapi.TransactionContextInterface) error {

	transientMap, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("error getting transient: %v", err)
	}

	transientAssetJSON, ok := transientMap["asset_properties"]
	if !ok {
		return fmt.Errorf("user not found in the transient map input")
	}

	type UserTransientInput struct {
		Type     string `json:"objectType"`
		ID       string `json:"id"`
		Name     string `json:"name"`
		Gender   string `json:"gender"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Salt     string `json:"salt"`
		PhoneNo  string `json:"phoneno"`
		UserType string `json:"usertype"`
	}

	var userInput UserTransientInput
	err = json.Unmarshal(transientAssetJSON, &userInput)
	if err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %v", err)
	}

	if len(userInput.Type) == 0 {
		return fmt.Errorf("objectType field must be a non-empty string")
	}
	if len(userInput.ID) == 0 {
		return fmt.Errorf("userID field must be a non-empty string")
	}
	if len(userInput.Name) == 0 {
		return fmt.Errorf("Name field must be a non-empty string")
	}
	if len(userInput.Gender) == 0 {
		return fmt.Errorf("Gender field must be a non-empty string")
	}
	if len(userInput.Email) == 0 {
		return fmt.Errorf("Email field must be a non-empty string")
	}
	if len(userInput.Password) == 0 {
		return fmt.Errorf("Password field must be a non-empty string")
	}
	if len(userInput.Salt) == 0 {
		return fmt.Errorf("Salt field must be a non-empty string")
	}
	if len(userInput.PhoneNo) == 0 {
		return fmt.Errorf("PhoneNo field must be a non-empty string")
	}
	if len(userInput.UserType) == 0 {
		return fmt.Errorf("UserType field must be a non-empty string")
	}
	// Check if asset already exists
	userAsBytes, err := ctx.GetStub().GetPrivateData(presCollection, userInput.ID)
	if err != nil {
		return fmt.Errorf("failed to get user: %v", err)
	} else if userAsBytes == nil {
		fmt.Println("user not exists: " + userInput.ID)
		return fmt.Errorf("this user doesn't exists: " + userInput.ID)
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
		return fmt.Errorf("Createuser cannot be performed: Error %v", err)
	}

	// Make submitting client the owner
	user := User{
		Type:     userInput.Type,
		ID:       userInput.ID,
		Name:     userInput.Name,
		Gender:   userInput.Gender,
		Email:    userInput.Email,
		Password: userInput.Password,
		Salt:     userInput.Salt,
		PhoneNo:  userInput.PhoneNo,
		UserType: userInput.UserType,
		Creator:  clientID,
	}
	presJSONasBytes, err := json.Marshal(user)
	if err != nil {
		return fmt.Errorf("failed to marshal user into JSON: %v", err)
	}

	err = ctx.GetStub().PutPrivateData(presCollection, userInput.ID, presJSONasBytes)
	if err != nil {
		return fmt.Errorf("failed to put asset into private data collecton: %v", err)
	}

	return nil
}
