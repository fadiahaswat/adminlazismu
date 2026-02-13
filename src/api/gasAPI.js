/**
 * =====================================================================
 * GAS API SERVICE - Google Apps Script Backend Communication
 * =====================================================================
 * Handles all communication with the Google Apps Script backend
 * Uses UUID-based operations (idTransaksi) instead of row numbers
 */

import { GAS_API_URL } from '../constants.js';

/**
 * Make API request to Google Apps Script backend
 * @param {string} action - Action to perform
 * @param {object} payload - Request payload
 * @returns {Promise<object>} Response data
 */
async function makeRequest(action, payload = {}) {
  try {
    const requestBody = {
      action,
      ...payload
    };
    
    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.message || 'Unknown error occurred');
    }
    
    return data.data;
  } catch (error) {
    console.error(`API Error [${action}]:`, error);
    throw error;
  }
}

/**
 * Fetch all donation data
 * @returns {Promise<Array>} Array of donation objects
 */
export async function fetchDonations() {
  try {
    const response = await fetch(GAS_API_URL);
    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.message || 'Failed to fetch data');
    }
    
    return data.data || [];
  } catch (error) {
    console.error('Error fetching donations:', error);
    throw error;
  }
}

/**
 * Verify a donation by ID
 * @param {string} idTransaksi - UUID of the transaction
 * @returns {Promise<object>} Verification result
 */
export async function verifyDonation(idTransaksi) {
  if (!idTransaksi) {
    throw new Error('ID Transaksi is required');
  }
  
  return makeRequest('verify', { id: idTransaksi });
}

/**
 * Update a donation by ID
 * @param {string} idTransaksi - UUID of the transaction
 * @param {object} donationData - Updated donation data
 * @returns {Promise<object>} Update result
 */
export async function updateDonation(idTransaksi, donationData) {
  if (!idTransaksi) {
    throw new Error('ID Transaksi is required');
  }
  
  if (!donationData || typeof donationData !== 'object') {
    throw new Error('Invalid donation data');
  }
  
  return makeRequest('update', {
    id: idTransaksi,
    payload: donationData
  });
}

/**
 * Delete a donation by ID
 * @param {string} idTransaksi - UUID of the transaction
 * @returns {Promise<object>} Delete result
 */
export async function deleteDonation(idTransaksi) {
  if (!idTransaksi) {
    throw new Error('ID Transaksi is required');
  }
  
  return makeRequest('delete', { id: idTransaksi });
}

/**
 * Save receipt data (kuitansi)
 * @param {object} receiptData - Receipt data
 * @returns {Promise<object>} Save result
 */
export async function saveReceipt(receiptData) {
  if (!receiptData || typeof receiptData !== 'object') {
    throw new Error('Invalid receipt data');
  }
  
  return makeRequest('kuitansi', receiptData);
}

/**
 * Send receipt notification
 * @param {object} receiptData - Receipt data
 * @returns {Promise<object>} Send result
 */
export async function sendReceipt(receiptData) {
  return makeRequest('sendReceipt', receiptData);
}
