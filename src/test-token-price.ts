// Test script for token price services
import { getArweaveTokenPrice, getUpdatedTokenPrice } from './services/tokenPriceService';

async function testTokenPriceServices() {
  console.log('Testing token price services...');
  
  try {
    console.log('\nTesting getArweaveTokenPrice...');
    const arweavePrice = await getArweaveTokenPrice();
    console.log('Arweave price:', arweavePrice);
  } catch (error) {
    console.error('Error testing getArweaveTokenPrice:', error);
  }
  
  try {
    console.log('\nTesting getUpdatedTokenPrice...');
    const updatedPrice = await getUpdatedTokenPrice();
    console.log('Updated price:', updatedPrice);
  } catch (error) {
    console.error('Error testing getUpdatedTokenPrice:', error);
  }
  
  console.log('\nTests completed');
}

// Run the tests
testTokenPriceServices().catch(error => {
  console.error('Unhandled error:', error);
});
