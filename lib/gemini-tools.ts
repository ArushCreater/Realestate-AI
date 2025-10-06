import { GoogleGenerativeAI, FunctionDeclaration, Tool, SchemaType } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define function declarations for Gemini to use
const getAveragePriceFunction: FunctionDeclaration = {
  name: "get_average_price",
  description: "Get the average property price for a specific NSW locality/suburb. Can filter by year and property type (e.g., 'Residence', 'Vacant land', 'Commercial').",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      locality: {
        type: SchemaType.STRING,
        description: "The suburb or locality name (e.g., 'Newcastle', 'Sydney', 'Castle Hill')"
      },
      year: {
        type: SchemaType.NUMBER,
        description: "Optional: Filter by specific year (e.g., 2022, 2023, 2024)"
      },
      property_type: {
        type: SchemaType.STRING,
        description: "Optional: Filter by property type (e.g., 'Residence', 'Vacant land', 'Commercial')"
      }
    },
    required: ["locality"]
  }
};

const getMarketTrendsFunction: FunctionDeclaration = {
  name: "get_market_trends",
  description: "Get year-over-year market trends for a locality, showing price changes and growth rates over time.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      locality: {
        type: SchemaType.STRING,
        description: "The suburb or locality name"
      },
      start_year: {
        type: SchemaType.NUMBER,
        description: "Start year for trend analysis (e.g., 2020)"
      },
      end_year: {
        type: SchemaType.NUMBER,
        description: "End year for trend analysis (e.g., 2024)"
      }
    },
    required: ["locality", "start_year", "end_year"]
  }
};

const getTopLocalitiesFunction: FunctionDeclaration = {
  name: "get_top_localities",
  description: "Get the top localities/suburbs ranked by price or sales. CRITICAL: For residential suburbs, ALWAYS set property_type to 'residence' to exclude massive commercial/industrial sales that can be $50M+.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      year: {
        type: SchemaType.NUMBER,
        description: "Optional: Filter by specific year"
      },
      limit: {
        type: SchemaType.NUMBER,
        description: "Number of localities to return (default: 10)"
      },
      sort_by: {
        type: SchemaType.STRING,
        description: "Sort by: 'avg_price', 'median_price', or 'total_sales' (default: 'avg_price')",
        enum: ["avg_price", "median_price", "total_sales"]
      },
      property_type: {
        type: SchemaType.STRING,
        description: "Filter by property type: 'residence' for residential homes, 'commercial', or 'vacant land'. For 'most expensive suburbs' queries, use 'residence'."
      }
    },
    required: []
  }
};

const getPriceRangeFunction: FunctionDeclaration = {
  name: "get_price_range",
  description: "Find properties within a specific price range. Can filter by locality and year.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      min_price: {
        type: SchemaType.NUMBER,
        description: "Minimum price (e.g., 500000)"
      },
      max_price: {
        type: SchemaType.NUMBER,
        description: "Maximum price (e.g., 1000000)"
      },
      locality: {
        type: SchemaType.STRING,
        description: "Optional: Filter by specific locality"
      },
      year: {
        type: SchemaType.NUMBER,
        description: "Optional: Filter by year"
      }
    },
    required: []
  }
};

const getLocalityStatsFunction: FunctionDeclaration = {
  name: "get_locality_stats",
  description: "Get comprehensive statistics for a specific locality including overall stats, breakdown by property type, and recent trends.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      locality: {
        type: SchemaType.STRING,
        description: "The suburb or locality name"
      }
    },
    required: ["locality"]
  }
};

// Create the tool with all function declarations
const propertyDataTool: Tool = {
  functionDeclarations: [
    getAveragePriceFunction,
    getMarketTrendsFunction,
    getTopLocalitiesFunction,
    getPriceRangeFunction,
    getLocalityStatsFunction
  ]
};

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

// Function to call the Python backend
async function callPythonAPI(endpoint: string, data?: any, method: 'GET' | 'POST' = 'POST'): Promise<any> {
  const url = `${PYTHON_API_URL}${endpoint}`;
  const options: RequestInit = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (data && method === 'POST') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Python API error (${response.status}):`, errorText);
    throw new Error(`API call failed: ${response.statusText} - ${errorText.substring(0, 200)}`);
  }
  return response.json();
}

// Execute function calls from Gemini
async function executeFunctionCall(functionName: string, args: any): Promise<any> {
  console.log(`🔧 Executing function: ${functionName}`, args);

  try {
    switch (functionName) {
      case 'get_average_price':
        return await callPythonAPI('/average-price', args);
      
      case 'get_market_trends':
        return await callPythonAPI('/market-trends', args);
      
      case 'get_top_localities':
        return await callPythonAPI('/top-localities', args);
      
      case 'get_price_range':
        return await callPythonAPI('/price-range', args);
      
      case 'get_locality_stats':
        return await callPythonAPI(`/locality-stats/${args.locality}`, undefined, 'GET');
      
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  } catch (error) {
    // Return a graceful error message instead of throwing
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`⚠️ Function call failed: ${errorMessage}`);
    
    // Return a structured error that Gemini can understand and work with
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return {
        error: 'data_not_found',
        message: `No data available in the dataset for this query. The locality may not exist in our NSW property sales records.`,
        note: 'You can still provide insights using your general knowledge about NSW real estate.'
      };
    }
    
    return {
      error: 'api_error',
      message: errorMessage,
      note: 'You can still provide general insights based on your knowledge.'
    };
  }
}

export async function chatWithGemini(userMessage: string, conversationHistory: any[] = []): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    tools: [propertyDataTool],
    systemInstruction: `You are an expert NSW real estate analyst with access to comprehensive NSW property sales data AND general real estate market knowledge.

HOW TO USE YOUR TOOLS:
• Use function calls to get SPECIFIC NSW property data (prices, trends, localities)
• If a function returns an error (e.g., "data_not_found"), DON'T apologize or stop - instead:
  - Acknowledge the data isn't available
  - Provide helpful insights using your general knowledge
  - Explain what you know about the area, market, or question
• Use your general knowledge for:
  - Market context and broader trends
  - Comparison with other Australian cities
  - Economic factors affecting property prices
  - Infrastructure and development impacts
  - Investment strategies and advice
  - When specific localities aren't in the dataset
• ALWAYS cross-reference function data with your knowledge for richer insights
• If function data seems unusual, use your knowledge to validate or explain

CRITICAL DATA RULES:
• When showing "current" or "average" price, ALWAYS use the MOST RECENT YEAR from the trends data
• The "overall average" from locality_stats includes ALL historical years - ignore it for current price
• ALWAYS look at the recent_yearly_trends array and use the LATEST year (2024 or 2025)
• Example: If 2025 shows $1,197,593, say "Current average: $1,197,593 (2025)"
• Never mix historical averages with current prices

CRITICAL PROPERTY TYPE FILTERING:
• When users ask about "most expensive suburbs", "best places to buy", or "top suburbs", ALWAYS filter for RESIDENTIAL properties only
• Commercial and industrial sales can be $50M+ and massively skew averages (e.g., Badgerys Creek commercial land)
• Use property_type: "residence" in function calls for residential queries
• Only show commercial/industrial data if explicitly asked
• If a suburb has suspiciously high prices (>$10M average), it's likely commercial - filter it out or mention it's commercial

FORMATTING RULES:
• Use clean, natural language with minimal markdown
• Use bold (**text**) ONLY for key numbers or locality names
• Use bullet points (•) for lists, not asterisks or hyphens
• Keep responses concise (3-5 key points max)
• Present trends chronologically (oldest → newest)

RESPONSE STRUCTURE:
1. Start with the CURRENT YEAR average price from function data
2. Show median price if significantly different
3. Show 2-3 year trend from data
4. Add context using your general knowledge:
   - How this compares to Sydney average or other major areas
   - Any known infrastructure projects affecting the area
   - Market factors (interest rates, economic conditions)
5. Provide informed recommendation combining data + knowledge

DATA ACCURACY:
• Round prices to whole dollars (e.g., $1,197,593)
• If average differs from median, explain: "luxury properties skew the average higher"
• For trends, be specific: "decreased 12% from 2024" not just "decreased"
• Current year = 2025 or latest year in data
• Residential averages should be <$10M (if higher, something's wrong)

FUNCTIONS (Your Primary Data Source):
• get_market_trends → get year-by-year data
• get_locality_stats → comprehensive overview (use recent_yearly_trends for current price!)
• get_average_price → specific year prices (ADD property_type: "residence" for residential!)
• get_top_localities → best investment areas (ADD property_type filter!)

COMBINING DATA + KNOWLEDGE:
Example with data: "Based on the data, Castle Hill's average is $1,817,539 (2025), down 24% from 2024. This decline aligns with broader Sydney market corrections due to rising interest rates and reduced buyer demand. Castle Hill remains popular due to its schools and M2 motorway access, suggesting this could be a buying opportunity."

Example when data not available: "While I don't have specific sales data for The Gables in my dataset, I can tell you about the broader area. The Gables is typically a newer development area. For accurate current pricing, I'd recommend checking recent sales on domain.com.au or realestate.com.au. Generally, newer developments in outer Sydney areas range from $X-Y depending on property type and size."

TONE: Professional, insightful, helpful. Use hard data when available, general knowledge when not. Never just say "data not found" - always provide value.`
  });

  const chat = model.startChat({
    history: conversationHistory,
  });

  console.log('📤 Sending to Gemini:', userMessage);
  let result = await chat.sendMessage(userMessage);
  let response = result.response;
  
  console.log('📥 Initial response:', response);

  // Handle function calls
  let loopCount = 0;
  while (loopCount < 5) {
    const functionCalls = response.functionCalls();
    
    if (!functionCalls || functionCalls.length === 0) {
      break; // No more function calls, we're done
    }
    
    loopCount++;
    console.log(`📞 Gemini is calling ${functionCalls.length} function(s)...`);
    
    const functionResponses = await Promise.all(
      functionCalls.map(async (call) => {
        console.log(`  → Calling: ${call.name}`, call.args);
        const functionResult = await executeFunctionCall(call.name, call.args);
        console.log(`  ← Result:`, functionResult);
        return {
          functionResponse: {
            name: call.name,
            response: functionResult
          }
        };
      })
    );

    // Send function results back to Gemini
    console.log('📤 Sending function results back to Gemini...');
    result = await chat.sendMessage(functionResponses);
    response = result.response;
    console.log('📥 Got response from Gemini');
  }

  const finalText = response.text();
  console.log('✅ Final response text:', finalText ? 'Got text' : 'EMPTY!');
  return finalText;
}

