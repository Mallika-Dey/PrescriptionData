/*
Copyright IBM Corp. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/
package chaincode_test

import (
	"encoding/json"
	"fmt"
	"testing"

	"github.com/hyperledger/fabric-protos-go/ledger/queryresult"

	"github.com/hyperledger/fabric-samples/asset-transfer-private-data/chaincode-go/chaincode"
	"github.com/hyperledger/fabric-samples/asset-transfer-private-data/chaincode-go/chaincode/mocks"
	"github.com/stretchr/testify/require"
)

/*
For details on generating the mocks, see comments in the file asset_transfer_test.go
*/
func TestReadPrescription(t *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsOrg1()
	assetTransferCC := chaincode.SmartContract{}

	assetBytes, err := assetTransferCC.ReadPrescription(transactionContext, "pres1")
	require.NoError(t, err)
	require.Nil(t, assetBytes)

	chaincodeStub.GetPrivateDataReturns(nil, fmt.Errorf("unable to retrieve asset"))
	assetBytes, err = assetTransferCC.ReadPrescription(transactionContext, "pres1")
	require.EqualError(t, err, "failed to read asset: unable to retrieve asset")

	testAsset := &chaincode.Prescription{
		Type:       "testfulasset",
		ID:         "pres1",
		PID:        "p1",
		DocID:      myOrg1Clientid,
		Name:       "Mallika Dey",
		DoctorName: "Dr. Robert",
		Age:        "22",
		Date:       "23.12.2022",
		Symtomp:    "high temparature",
		Disease:    "fever",
	}
	setReturnPrivateDataInStub(t, chaincodeStub, testAsset)
	assetRead, err := assetTransferCC.ReadPrescription(transactionContext, "pres1")
	require.NoError(t, err)
	require.Equal(t, testAsset, assetRead)
}

func TestReadAssetPrivateDetails(t *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsOrg1()
	assetTransferCC := chaincode.SmartContract{}

	assetBytes, err := assetTransferCC.ReadAssetPrivateDetails(transactionContext, myOrg1PrivCollection, "pres1")
	require.NoError(t, err)
	require.Nil(t, assetBytes)

	//read from the collection with no access
	chaincodeStub.GetPrivateDataReturns(nil, fmt.Errorf("collection not found"))
	assetBytes, err = assetTransferCC.ReadAssetPrivateDetails(transactionContext, myOrg2PrivCollection, "pres1")
	require.EqualError(t, err, "failed to read asset details: collection not found")

	returnPrivData := &chaincode.PrescriptionPrivateDetails{
		ID:        "pres1",
		Medicine:  "napa",
		TxId:      "JKiyuyhhn",
		Available: 5,
	}
	setReturnAssetPrivateDetailsInStub(t, chaincodeStub, returnPrivData)
	assetRead, err := assetTransferCC.ReadAssetPrivateDetails(transactionContext, myOrg1PrivCollection, "pres1")
	require.NoError(t, err)
	require.Equal(t, returnPrivData, assetRead)
}

func TestReadTransferAgreement(t *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsOrg1()
	assetTransferCC := chaincode.SmartContract{}

	//TransferAgreement does not exist
	assetBytes, err := assetTransferCC.ReadTransferAgreement(transactionContext, "pres1")
	require.NoError(t, err)
	require.Nil(t, assetBytes)

	chaincodeStub.GetPrivateDataReturns([]byte(myOrg2Clientid), nil)
	expectedData := &chaincode.TransferAgreement{
		ID:      "id1",
		BuyerID: myOrg2Clientid,
	}
	dataRead, err := assetTransferCC.ReadTransferAgreement(transactionContext, "pres1")
	require.NoError(t, err)
	require.Equal(t, expectedData, dataRead)
}

func TestQueryAssetByOwner(t *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsOrg1()

	asset := &chaincode.Prescription{
		Type:       "valuableasset",
		ID:         "asset1",
		PID:        "p1",
		DocID:      "user1",
		Name:       "Preeti",
		DoctorName: "Dr. Robert",
		Age:        "22",
		Date:       "23.12.2022",
		Symtomp:    "high temparature",
		Disease:    "fever",
	}
	asset1Bytes, err := json.Marshal(asset)
	require.NoError(t, err)

	iterator := &mocks.StateQueryIterator{}
	iterator.HasNextReturnsOnCall(0, true)
	iterator.HasNextReturnsOnCall(1, false)
	iterator.NextReturns(&queryresult.KV{Value: asset1Bytes}, nil)
	chaincodeStub.GetPrivateDataQueryResultReturns(iterator, nil)

	assetTransferCC := &chaincode.SmartContract{}
	assets, err := assetTransferCC.QueryAssetByOwner(transactionContext, "valuableasset", "user1")
	require.NoError(t, err)
	require.Equal(t, []*chaincode.Prescription{asset}, assets)

	iterator.HasNextReturns(true)
	iterator.NextReturns(nil, fmt.Errorf("failed retrieving next item"))
	assets, err = assetTransferCC.QueryAssetByOwner(transactionContext, "valuableasset", "user1")
	require.EqualError(t, err, "failed retrieving next item")
	require.Nil(t, assets)

}

func TestQueryAssets(t *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsOrg1()
	//Iterator with no records
	iterator := &mocks.StateQueryIterator{}
	iterator.HasNextReturns(false)
	chaincodeStub.GetPrivateDataQueryResultReturns(iterator, nil)

	assetTransferCC := &chaincode.SmartContract{}
	assets, err := assetTransferCC.QueryAssets(transactionContext, "querystr")
	require.NoError(t, err)
	require.Equal(t, []*chaincode.Prescription{}, assets)

	iterator = &mocks.StateQueryIterator{}
	chaincodeStub.GetPrivateDataQueryResultReturns(iterator, nil)
	iterator.HasNextReturns(true)
	iterator.NextReturns(nil, fmt.Errorf("failed retrieving next item"))
	assets, err = assetTransferCC.QueryAssets(transactionContext, "querystr")
	require.EqualError(t, err, "failed retrieving next item")
	require.Nil(t, assets)

	asset := &chaincode.Prescription{
		Type:       "valuableasset",
		ID:         "asset1",
		PID:        "p1",
		DocID:      "user1",
		Name:       "Preeti",
		DoctorName: "Dr. Robert",
		Age:        "22",
		Date:       "23.12.2022",
		Symtomp:    "high temparature",
		Disease:    "fever",
	}
	asset1Bytes, err := json.Marshal(asset)
	require.NoError(t, err)

	iterator = &mocks.StateQueryIterator{}
	chaincodeStub.GetPrivateDataQueryResultReturns(iterator, nil)
	iterator.HasNextReturnsOnCall(0, true)
	iterator.HasNextReturnsOnCall(1, false)
	iterator.NextReturns(&queryresult.KV{Value: asset1Bytes}, nil)

	assets, err = assetTransferCC.QueryAssets(transactionContext, "querystr")
	require.NoError(t, err)
	require.Equal(t, []*chaincode.Prescription{asset}, assets)
}

func TestGetAssetByRange(t *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsOrg1()
	//Iterator with no records
	iterator := &mocks.StateQueryIterator{}
	iterator.HasNextReturns(false)
	chaincodeStub.GetPrivateDataByRangeReturns(iterator, nil)

	assetTransferCC := &chaincode.SmartContract{}
	assets, err := assetTransferCC.GetAssetByRange(transactionContext, "st", "end")
	require.NoError(t, err)
	require.Equal(t, []*chaincode.Prescription{}, assets)

	iterator = &mocks.StateQueryIterator{}
	chaincodeStub.GetPrivateDataByRangeReturns(iterator, nil)
	iterator.HasNextReturns(true)
	iterator.NextReturns(nil, fmt.Errorf("failed retrieving next item"))
	assets, err = assetTransferCC.GetAssetByRange(transactionContext, "st", "end")
	require.EqualError(t, err, "failed retrieving next item")
	require.Nil(t, assets)

	asset := &chaincode.Prescription{
		Type:       "valuableasset",
		ID:         "asset1",
		PID:        "p1",
		DocID:      "user1",
		Name:       "Preeti",
		DoctorName: "Dr. Robert",
		Age:        "22",
		Date:       "23.12.2022",
		Symtomp:    "high temparature",
		Disease:    "fever",
	}
	asset1Bytes, err := json.Marshal(asset)
	require.NoError(t, err)

	iterator = &mocks.StateQueryIterator{}
	chaincodeStub.GetPrivateDataByRangeReturns(iterator, nil)
	iterator.HasNextReturnsOnCall(0, true)
	iterator.HasNextReturnsOnCall(1, false)
	iterator.NextReturns(&queryresult.KV{Value: asset1Bytes}, nil)

	assets, err = assetTransferCC.GetAssetByRange(transactionContext, "st", "end")
	require.NoError(t, err)
	require.Equal(t, []*chaincode.Prescription{asset}, assets)

}
