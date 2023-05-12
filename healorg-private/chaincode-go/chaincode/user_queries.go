package chaincode

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func (s *SmartContract) FindUser(ctx contractapi.TransactionContextInterface, userID string) (*User, error) {

	log.Printf("ReadPatient: collection %v, ID %v", presCollection, userID)
	assetJSON, err := ctx.GetStub().GetPrivateData(presCollection, userID) //get the asset from chaincode state
	if err != nil {
		return nil, fmt.Errorf("failed to read asset: %v", err)
	}

	//No Asset found, return empty response
	if assetJSON == nil {
		log.Printf("%v does not exist in collection %v", userID, presCollection)
		return nil, nil
	}

	var user *User
	err = json.Unmarshal(assetJSON, &user)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal JSON: %v", err)
	}

	return user, nil

}
