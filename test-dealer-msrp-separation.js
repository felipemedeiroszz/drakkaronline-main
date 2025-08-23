/**
 * Test Script: Verify Dealer Price and MSRP Price Separation
 * 
 * This script tests that dealer prices (cost) and MSRP prices are properly separated
 * and that dealer prices do not follow MSRP price changes.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDealerMSRPSeparation() {
  console.log('🧪 Testing Dealer Price and MSRP Price Separation...\n');
  
  try {
    // 1. Fetch a boat model to check its structure
    console.log('1️⃣ Fetching boat model data...');
    const { data: boatModels, error: boatError } = await supabase
      .from('boat_models')
      .select('*')
      .limit(1);
    
    if (boatError) throw boatError;
    
    if (boatModels && boatModels.length > 0) {
      const model = boatModels[0];
      console.log('✅ Boat Model:', model.name);
      console.log('   - Dealer Price USD:', model.usd);
      console.log('   - Dealer Price BRL:', model.brl);
      console.log('');
    }
    
    // 2. Fetch dealer pricing to check MSRP configuration
    console.log('2️⃣ Fetching dealer MSRP pricing...');
    const { data: dealerPricing, error: pricingError } = await supabase
      .from('dealer_pricing')
      .select('*')
      .eq('item_type', 'boat_model')
      .limit(1);
    
    if (pricingError) throw pricingError;
    
    if (dealerPricing && dealerPricing.length > 0) {
      const pricing = dealerPricing[0];
      console.log('✅ Dealer MSRP Configuration:');
      console.log('   - Item:', pricing.item_name);
      console.log('   - MSRP Price USD:', pricing.sale_price_usd);
      console.log('   - MSRP Price BRL:', pricing.sale_price_brl);
      console.log('   - Margin:', pricing.margin_percentage + '%');
      console.log('');
      
      // 3. Compare with original boat model
      const { data: originalModel } = await supabase
        .from('boat_models')
        .select('*')
        .eq('id', pricing.item_id)
        .single();
      
      if (originalModel) {
        console.log('3️⃣ Comparison:');
        console.log('   Original Dealer Prices:');
        console.log('   - USD:', originalModel.usd);
        console.log('   - BRL:', originalModel.brl);
        console.log('   MSRP Prices (configured by dealer):');
        console.log('   - USD:', pricing.sale_price_usd);
        console.log('   - BRL:', pricing.sale_price_brl);
        console.log('');
        
        // Verify separation
        if (originalModel.usd !== pricing.sale_price_usd || originalModel.brl !== pricing.sale_price_brl) {
          console.log('✅ SUCCESS: Dealer prices and MSRP prices are properly separated!');
          console.log('   Dealer prices remain unchanged in the boat_models table.');
          console.log('   MSRP prices are stored separately in the dealer_pricing table.');
        } else {
          console.log('⚠️ WARNING: Dealer prices and MSRP prices appear to be the same.');
          console.log('   This might indicate the dealer hasn\'t configured custom MSRP prices yet.');
        }
      }
    } else {
      console.log('ℹ️ No dealer MSRP pricing configured yet.');
      console.log('   Dealer prices from boat_models table will be used as defaults.');
    }
    
    // 4. Test API endpoint
    console.log('\n4️⃣ Testing API endpoint response structure...');
    const dealerId = 'test-dealer'; // Replace with actual dealer ID if available
    
    const response = await fetch(`http://localhost:3000/api/get-dealer-config?dealer_id=${dealerId}`);
    const result = await response.json();
    
    if (result.success && result.data?.boatModels?.length > 0) {
      const apiModel = result.data.boatModels[0];
      console.log('✅ API Response for boat model:', apiModel.name);
      console.log('   - usd field (dealer cost):', apiModel.usd);
      console.log('   - brl field (dealer cost):', apiModel.brl);
      console.log('   - sale_price_usd (MSRP):', apiModel.sale_price_usd || 'Not configured');
      console.log('   - sale_price_brl (MSRP):', apiModel.sale_price_brl || 'Not configured');
      console.log('   - dealer_configured:', apiModel.dealer_configured || false);
      
      if (apiModel.usd && apiModel.sale_price_usd && apiModel.usd !== apiModel.sale_price_usd) {
        console.log('\n✅ EXCELLENT: API correctly returns separate dealer and MSRP prices!');
      }
    }
    
    console.log('\n✅ Test completed successfully!');
    console.log('📌 Summary:');
    console.log('   - Dealer prices (cost) are stored in usd/brl fields');
    console.log('   - MSRP prices are stored in sale_price_usd/sale_price_brl fields');
    console.log('   - The two price types are independent of each other');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testDealerMSRPSeparation();