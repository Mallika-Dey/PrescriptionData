/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const prescription = require('./lib/prescription');
const patient = require('./lib/patient');
const doctor = require('./lib/doctor');

module.exports.Prescription = prescription;
module.exports.Patient = patient;
module.exports.Doctor = doctor;
module.exports.contracts = [prescription, patient, doctor];
