"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from 'lucide-react';

// Dynamically import Joyride with SSR disabled
const Joyride = dynamic(() => import('react-joyride'), { ssr: false });

interface Transaction {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  amount: number;
  price: number;
  txId: string;
  isSequencerTx?: boolean;
  timestamp: Date;
  sandwichPairId?: string;
}

interface ProfitBreakdownItem {
  txId: string;
  profit: number;
  strategy: string;
  buyPrice?: number;
  sellPrice?: number;
  amount?: number;
}

interface ProfitResults {
  grossProfit: number;
  fees: number;
  netProfit: number;
  sequencerTxCount: number;
  profitBreakdown: ProfitBreakdownItem[];
  sandwichPairs: number;
}

interface TourCallbackData {
  status: string;
  type: string;
  index: number;
}

// Helper function to generate unique IDs
const generateUniqueId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
};

// Token configuration for random generation
const tokenConfig = {
  ETH: { 
    basePrice: 3200, 
    priceRange: 100,
    amountRange: { min: 0.1, max: 5 }
  },
  BTC: { 
    basePrice: 67000, 
    priceRange: 2000,
    amountRange: { min: 0.01, max: 0.5 }
  },
  SOL: { 
    basePrice: 85, 
    priceRange: 5,
    amountRange: { min: 5, max: 50 }
  },
  AVAX: { 
    basePrice: 40, 
    priceRange: 3,
    amountRange: { min: 10, max: 100 }
  },
  MATIC: { 
    basePrice: 1.2, 
    priceRange: 0.1,
    amountRange: { min: 100, max: 2000 }
  }
};

// Function to generate completely random transactions
const generateRandomTransactions = (): Transaction[] => {
  const tokenSymbols = Object.keys(tokenConfig);
  const transactionTypes: ('BUY' | 'SELL')[] = ['BUY', 'SELL'];
  const transactionCount = Math.floor(Math.random() * 3) + 5;
  
  const randomTransactions: Transaction[] = [];
  
  for (let i = 0; i < transactionCount; i++) {
    const symbol = tokenSymbols[Math.floor(Math.random() * tokenSymbols.length)] as keyof typeof tokenConfig;
    const config = tokenConfig[symbol];
    
    const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
    
    const amount = parseFloat(
      (Math.random() * (config.amountRange.max - config.amountRange.min) + config.amountRange.min).toFixed(2)
    );
    
    const priceVariation = (Math.random() - 0.5) * 2 * config.priceRange;
    const price = parseFloat((config.basePrice + priceVariation).toFixed(2));
    
    randomTransactions.push({
      id: generateUniqueId(),
      symbol,
      type,
      amount,
      price,
      txId: `Tx${i + 1}`,
      timestamp: new Date(),
    });
  }
  
  return randomTransactions;
};

function SandwichAttackComponent() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [draggedTx, setDraggedTx] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [profitResults, setProfitResults] = useState<ProfitResults | null>(null);
  const [censoredCount, setCensoredCount] = useState(0);
  const [reorderedCount, setReorderedCount] = useState(0);
  
  // Form states for custom transaction
  const [newTxSymbol, setNewTxSymbol] = useState("ETH");
  const [newTxAmount, setNewTxAmount] = useState("");
  const [newTxPrice, setNewTxPrice] = useState("");
  const [newTxType, setNewTxType] = useState<'BUY' | 'SELL'>('BUY');
  const [showAddForm, setShowAddForm] = useState(false);

  // Theme state - dark mode as default
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Tour state
  const [runTour, setRunTour] = useState(false);
  const [tourKey, setTourKey] = useState(0);

  const tokenSymbols = ["ETH", "BTC", "SOL", "AVAX", "MATIC"];
  const baseMarketPrices = { ETH: 3200, BTC: 67000, SOL: 85, AVAX: 40, MATIC: 1.2 };

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('sandwich-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Save theme preference and apply to document
  useEffect(() => {
    localStorage.setItem('sandwich-theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Theme toggle function
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Tour steps with theme toggle added
  const tourSteps = [
    {
      target: '.tour-welcome',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Welcome to Sandwich Attack Simulator! 🥪</h3>
          <p>Learn how MEV (Maximal Extractable Value) works through sandwich attacks - a common form of MEV extraction where sequencers profit by reordering transactions.</p>
          <p className="mt-2 text-sm text-blue-200">This simulation teaches you about blockchain MEV and sequencer power!</p>
        </div>
      ),
      placement: 'center' as const,
      disableBeacon: true,
    },
    {
      target: '.tour-theme-toggle',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Theme Toggle 🌙☀️</h3>
          <p>Switch between dark and light mode for comfortable viewing during MEV simulation.</p>
          <div className="mt-2 space-y-1 text-sm">
            <p>🌙 <strong>Dark Mode:</strong> Easy on the eyes for extended trading</p>
            <p>☀️ <strong>Light Mode:</strong> Classic bright interface</p>
            <p>💾 <strong>Persistent:</strong> Your preference is saved</p>
          </div>
        </div>
      ),
    },
    {
      target: '.tour-random-concept',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Random Transaction Generation 🎲</h3>
          <p><strong>Real-world simulation:</strong> Each reset generates 5-7 completely random transactions with:</p>
          <ul className="text-sm mt-2 space-y-1">
            <li>• Different tokens (ETH, BTC, SOL, AVAX, MATIC)</li>
            <li>• Realistic price variations</li>
            <li>• Random buy/sell orders</li>
            <li>• Variable amounts per token</li>
          </ul>
          <p className="mt-2 text-sm text-orange-200">This mimics real mempool activity!</p>
        </div>
      ),
    },
    {
      target: '.tour-execution-order',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Transaction Order Matters! 📋</h3>
          <p><strong>Key Concept:</strong> Transactions execute from top to bottom (1st → 2nd → 3rd...)</p>
          <p className="mt-2">As a sequencer, you can:</p>
          <ul className="text-sm mt-2 space-y-1">
            <li>🔄 <strong>Reorder:</strong> Drag transactions to change execution order</li>
            <li>🗑️ <strong>Censor:</strong> Drop transactions in trash to exclude them</li>
            <li>➕ <strong>Insert:</strong> Add your own transactions anywhere</li>
          </ul>
        </div>
      ),
    },
    {
      target: '.tour-add-transaction',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Add Your Transactions 🎯</h3>
          <p>Create custom buy/sell orders to implement sandwich attacks:</p>
          <ul className="text-sm mt-2 space-y-1">
            <li>• Choose any token and amount</li>
            <li>• Set custom prices</li>
            <li>• Your transactions show with pink highlighting</li>
          </ul>
          <p className="mt-2 text-sm text-green-200">Try adding a transaction to see how it works!</p>
        </div>
      ),
    },
    {
      target: '.tour-quick-sandwich',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Quick Sandwich Attack! 🥪</h3>
          <p><strong>One-click MEV:</strong> Click &quot;Quick Sandwich&quot; on any BUY transaction to automatically:</p>
          <ul className="text-sm mt-2 space-y-1">
            <li>1. 🟢 Insert BUY order <strong>before</strong> victim (lower price)</li>
            <li>2. 🎯 Victim&apos;s transaction executes (pushes price up)</li>
            <li>3. 🔴 Insert SELL order <strong>after</strong> victim (higher price)</li>
          </ul>
          <p className="mt-2 text-sm text-orange-200">Profit = (Sell Price - Buy Price) × Amount!</p>
        </div>
      ),
    },
    {
      target: '.tour-transaction-queue',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">The Transaction Queue 📝</h3>
          <p>This represents the <strong>mempool</strong> - transactions waiting to be included in a block.</p>
          <div className="mt-2 space-y-1 text-sm">
            <p>🔵 <strong>Blue numbers:</strong> Execution order position</p>
            <p>🌸 <strong>Pink highlight:</strong> Your inserted transactions</p>
            <p>🟣 <strong>Purple &quot;PAIRED&quot;:</strong> Sandwich attack pairs</p>
          </div>
          <p className="mt-2 text-sm text-blue-200">Drag transactions up/down to reorder them!</p>
        </div>
      ),
    },
    {
      target: '.tour-randomize-button',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Generate New Random Orders 🎲</h3>
          <p>Click this button to generate a completely new set of random transactions:</p>
          <ul className="text-sm mt-2 space-y-1">
            <li>• 5-7 new random transactions</li>
            <li>• Different tokens and amounts</li>
            <li>• Fresh MEV opportunities</li>
            <li>• Resets all statistics</li>
          </ul>
          <p className="mt-2 text-sm text-purple-200">Each randomization creates new learning scenarios!</p>
        </div>
      ),
    },
    {
      target: '.tour-statistics',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Your Sequencer Stats 📊</h3>
          <p>Track your MEV extraction activity:</p>
          <ul className="text-sm mt-2 space-y-1">
            <li>🔄 <strong>Reorders:</strong> How many times you changed order</li>
            <li>🗑️ <strong>Censored:</strong> Transactions you excluded</li>
            <li>🥪 <strong>Your Transactions:</strong> Orders you inserted</li>
          </ul>
          <p className="mt-2 text-sm text-purple-200">Higher numbers = more MEV activity!</p>
        </div>
      ),
    },
    {
      target: '.tour-censorship',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Censorship Power 🗑️</h3>
          <p><strong>Sequencer Control:</strong> You can prevent transactions from executing by dragging them here.</p>
          <p className="mt-2 text-sm">This represents the power sequencers have to:</p>
          <ul className="text-sm mt-1 space-y-1">
            <li>• Block competing MEV bots</li>
            <li>• Exclude unfavorable transactions</li>
            <li>• Control market dynamics</li>
          </ul>
          <p className="mt-2 text-sm text-red-200">⚠️ This is why decentralized sequencing is important!</p>
        </div>
      ),
    },
    {
      target: '.tour-submit-button',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Execute Block & Calculate Profits! 🚀</h3>
          <p>Once you&apos;ve arranged transactions to your advantage, submit the block to:</p>
          <ul className="text-sm mt-2 space-y-1">
            <li>• Execute all transactions in order</li>
            <li>• Calculate your sandwich attack profits</li>
            <li>• See detailed profit breakdown</li>
          </ul>
          <p className="mt-2 text-sm text-green-200">This simulates finalizing a block as a sequencer!</p>
        </div>
      ),
    },
    {
      target: '.tour-help-button',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Ready to Extract MEV! 💰</h3>
          <p>You now understand:</p>
          <ul className="text-sm mt-2 space-y-1">
            <li>✅ How sandwich attacks work</li>
            <li>✅ Sequencer powers and responsibilities</li>
            <li>✅ MEV extraction strategies</li>
            <li>✅ Why decentralization matters</li>
          </ul>
          <p className="mt-2 text-green-200 font-semibold">Try creating some sandwich attacks with the random orders!</p>
          <p className="mt-1 text-xs text-gray-300">Click this button anytime to restart the tour.</p>
        </div>
      ),
    },
  ];

  // Tour callback handler with proper type
  const handleTourCallback = (data: TourCallbackData) => {
    const { status } = data;
    const finishedStatuses = ["finished", "skipped"];
    if (finishedStatuses.includes(status)) {
      setRunTour(false);
    }
  };

  // Function to start/restart tour
  const startTour = () => {
    setRunTour(false);
    setTimeout(() => {
      setTourKey(prev => prev + 1);
      setRunTour(true);
    }, 100);
  };

  // Initialize without originalOrder reference
  useEffect(() => {
    const randomTxs = generateRandomTransactions();
    setTransactions(randomTxs);
  }, []);

  // Generate new random transactions without originalOrder
  const generateNewRandomOrder = () => {
    const randomTxs = generateRandomTransactions();
    setTransactions(randomTxs);
    setCensoredCount(0);
    setReorderedCount(0);
    setShowResults(false);
    setProfitResults(null);
  };

  // Native drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, txId: string) => {
    setDraggedTx(txId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", txId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (!draggedTx) return;

    const draggedIndex = transactions.findIndex(tx => tx.id === draggedTx);
    if (draggedIndex === -1 || draggedIndex === dropIndex) return;

    const newTransactions = [...transactions];
    const [draggedTransaction] = newTransactions.splice(draggedIndex, 1);
    newTransactions.splice(dropIndex, 0, draggedTransaction);

    setTransactions(newTransactions);
    setReorderedCount(prev => prev + 1);
    setDraggedTx(null);
  };

  // Handle dropping transaction to trash (censorship)
  const handleTrashDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleTrashDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedTx) return;

    setTransactions(prev => prev.filter(tx => tx.id !== draggedTx));
    setCensoredCount(prev => prev + 1);
    setDraggedTx(null);
  };

  // Add custom transaction
  const handleAddCustomTx = () => {
    const amount = parseFloat(newTxAmount);
    const price = parseFloat(newTxPrice);
    
    if (!amount || amount <= 0 || !price || price <= 0) {
      alert("Please enter valid amount and price");
      return;
    }

    const newTx: Transaction = {
      id: generateUniqueId(),
      symbol: newTxSymbol,
      type: newTxType,
      amount,
      price,
      txId: `${newTxType}${transactions.filter(t => t.isSequencerTx).length + 1}`,
      isSequencerTx: true,
      timestamp: new Date()
    };

    setTransactions(prev => [newTx, ...prev]);
    setNewTxAmount("");
    setNewTxPrice("");
    setShowAddForm(false);
  };

  // Quick sandwich attack helper with fixed pairId usage
  const handleQuickSandwich = (targetTxIndex: number) => {
    const targetTx = transactions[targetTxIndex];
    if (!targetTx || targetTx.type !== 'BUY') return;

    // Generate sandwichPairId directly without intermediate variable
    const sandwichPairId = generateUniqueId();
    const buyPrice = targetTx.price - 1;
    const sellPrice = targetTx.price + 2;

    const frontRunBuy: Transaction = {
      id: generateUniqueId(),
      symbol: targetTx.symbol,
      type: 'BUY',
      amount: targetTx.amount,
      price: buyPrice,
      txId: `SandwichBuy${transactions.filter(t => t.isSequencerTx).length + 1}`,
      isSequencerTx: true,
      timestamp: new Date(),
      sandwichPairId
    };

    const backRunSell: Transaction = {
      id: generateUniqueId(),
      symbol: targetTx.symbol,
      type: 'SELL',
      amount: targetTx.amount,
      price: sellPrice,
      txId: `SandwichSell${transactions.filter(t => t.isSequencerTx).length + 2}`,
      isSequencerTx: true,
      timestamp: new Date(),
      sandwichPairId
    };

    const newTransactions = [...transactions];
    newTransactions.splice(targetTxIndex, 0, frontRunBuy);
    newTransactions.splice(targetTxIndex + 2, 0, backRunSell);
    
    setTransactions(newTransactions);
  };

  // Calculate sandwich attack profits with proper return type
  const calculateProfit = (): ProfitResults => {
    let totalProfit = 0;
    const executedTxs = [...transactions];
    const profitBreakdown: ProfitBreakdownItem[] = [];
    
    const sandwichPairs = new Map<string, Transaction[]>();
    const individualTxs: Transaction[] = [];

    executedTxs.forEach(tx => {
      if (tx.isSequencerTx) {
        if (tx.sandwichPairId) {
          if (!sandwichPairs.has(tx.sandwichPairId)) {
            sandwichPairs.set(tx.sandwichPairId, []);
          }
          sandwichPairs.get(tx.sandwichPairId)!.push(tx);
        } else {
          individualTxs.push(tx);
        }
      }
    });

    sandwichPairs.forEach((pair) => {
      const buyTx = pair.find(tx => tx.type === 'BUY');
      const sellTx = pair.find(tx => tx.type === 'SELL');
      
      if (buyTx && sellTx && buyTx.amount === sellTx.amount && buyTx.symbol === sellTx.symbol) {
        const profit = (sellTx.price - buyTx.price) * buyTx.amount;
        totalProfit += profit;
        
        profitBreakdown.push({
          txId: `${buyTx.txId} → ${sellTx.txId}`,
          profit,
          strategy: `Sandwich: Buy ${buyTx.amount} ${buyTx.symbol} at $${buyTx.price}, sell at $${sellTx.price}`,
          buyPrice: buyTx.price,
          sellPrice: sellTx.price,
          amount: buyTx.amount
        });
      }
    });

    individualTxs.forEach(tx => {
      const txIndex = executedTxs.findIndex(t => t.id === tx.id);
      const nextTx = executedTxs[txIndex + 1];
      
      if (nextTx && !nextTx.isSequencerTx) {
        let profit = 0;
        let strategy = "";
        
        if (tx.type === "BUY" && nextTx.type === "BUY") {
          profit = 2 * tx.amount;
          strategy = `Front-run BUY: Bought before ${nextTx.txId}, gained $2/token`;
        } else if (tx.type === "SELL" && nextTx.type === "SELL") {
          profit = 2 * tx.amount;
          strategy = `Front-run SELL: Sold before ${nextTx.txId}, gained $2/token`;
        } else if (tx.type === "BUY" && nextTx.type === "SELL") {
          profit = -2 * tx.amount;
          strategy = `Bad timing: Bought before ${nextTx.txId} SELL, lost $2/token`;
        } else if (tx.type === "SELL" && nextTx.type === "BUY") {
          profit = -2 * tx.amount;
          strategy = `Bad timing: Sold before ${nextTx.txId} BUY, lost $2/token`;
        }
        
        totalProfit += profit;
        profitBreakdown.push({
          txId: tx.txId,
          profit,
          strategy
        });
      }
    });

    return {
      grossProfit: totalProfit,
      fees: 0,
      netProfit: totalProfit,
      sequencerTxCount: executedTxs.filter(tx => tx.isSequencerTx).length,
      profitBreakdown,
      sandwichPairs: sandwichPairs.size
    };
  };

  // Submit block and show results
  const handleSubmitBlock = () => {
    const results = calculateProfit();
    setProfitResults(results);
    setShowResults(true);
  };

  // Reset simulation
  const handleReset = () => {
    generateNewRandomOrder();
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      {/* Tour Component */}
      <Joyride
        key={tourKey}
        steps={tourSteps}
        run={runTour}
        callback={handleTourCallback}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        styles={{
          options: {
            arrowColor: "#ec4899",
            backgroundColor: isDarkMode ? "#1f2937" : "#ec4899",
            overlayColor: "rgba(236, 72, 153, 0.3)",
            primaryColor: "#ec4899",
            textColor: isDarkMode ? "#e5e7eb" : "#fff",
            width: 360,
            zIndex: 1000,
          },
          spotlight: {
            backgroundColor: "transparent",
            border: "2px solid #ec4899",
          },
        }}
        locale={{
          back: "← Back",
          close: "✕",
          last: "Start MEV Extraction!",
          next: "Next →",
          skip: "Skip Tour",
        }}
      />

      {/* Header */}
      <div className={`border rounded-lg p-4 mb-6 tour-welcome transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-pink-900/20 to-rose-900/20 border-pink-700' 
          : 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200'
      }`}>
        <div className="flex justify-between items-center">
          <div className="tour-random-concept">
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              🥪 Sandwich Attack Simulation
            </h1>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
              Random Orders Generated Each Time
            </p>
            <div className="mt-2 text-sm text-pink-400">
              <span className="font-semibold">Execution Order:</span> Top to Bottom (Transaction 1 → 2 → 3...)
            </div>
            <div className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              🎲 <strong>New Feature:</strong> Completely random transactions with varying tokens, amounts, and prices
            </div>
          </div>
          <div className="flex gap-2">
            {/* Theme Toggle Button */}
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="sm"
              className={`tour-theme-toggle p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <motion.div
                initial={false}
                animate={{ rotate: isDarkMode ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </motion.div>
            </Button>
            <Button
              onClick={startTour}
              className="tour-help-button bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              🆘 Start Tour
            </Button>
            <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-pink-600 hover:bg-pink-700">
              {showAddForm ? "Cancel" : "➕ Add Transaction"}
            </Button>
            <Button onClick={handleReset} variant="outline" className={`border-pink-300 text-pink-600 ${
              isDarkMode ? 'hover:bg-pink-900/20' : ''
            }`}>
              🔄 Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Custom Transaction Form */}
        {showAddForm && (
          <div className="lg:col-span-1">
            <Card className={`tour-add-transaction transition-colors duration-300 ${
              isDarkMode ? 'border-pink-700 bg-gray-800' : 'border-pink-200'
            }`}>
              <CardHeader className={`border-b transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-pink-900/20 border-pink-700' 
                  : 'bg-pink-50 border-pink-200'
              }`}>
                <CardTitle className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  🎯 Add Transaction
                </CardTitle>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Create buy/sell orders manually
                </p>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Token
                  </label>
                  <select
                    value={newTxSymbol}
                    onChange={(e) => setNewTxSymbol(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-pink-500 transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'border-gray-300'
                    }`}
                  >
                    {tokenSymbols.map(symbol => (
                      <option key={symbol} value={symbol}>{symbol}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={newTxType === 'BUY'}
                      onChange={() => setNewTxType('BUY')}
                      className="text-green-600"
                    />
                    <span className="text-green-600 font-semibold">BUY</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={newTxType === 'SELL'}
                      onChange={() => setNewTxType('SELL')}
                      className="text-red-600"
                    />
                    <span className="text-red-600 font-semibold">SELL</span>
                  </label>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTxAmount}
                    onChange={(e) => setNewTxAmount(e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-pink-500 transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Price per Token
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTxPrice}
                    onChange={(e) => setNewTxPrice(e.target.value)}
                    placeholder={`${baseMarketPrices[newTxSymbol as keyof typeof baseMarketPrices]}`}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-pink-500 transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                <Button onClick={handleAddCustomTx} className="w-full bg-pink-600 hover:bg-pink-700">
                  Add Transaction
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transaction Queue */}
        <div className={showAddForm ? "lg:col-span-2" : "lg:col-span-3"}>
          <Card className={`tour-transaction-queue transition-colors duration-300 ${
            isDarkMode ? 'border-pink-700 bg-gray-800' : 'border-pink-200'
          }`}>
            <CardHeader className={`border-b transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-pink-900/20 border-pink-700' 
                : 'bg-pink-50 border-pink-200'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    📋 Random Transaction Queue ({transactions.length})
                  </CardTitle>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Each reset generates completely new random orders
                  </p>
                </div>
                <Button 
                  onClick={generateNewRandomOrder} 
                  size="sm"
                  className="tour-randomize-button bg-purple-600 hover:bg-purple-700"
                >
                  🎲 Randomize
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className={`space-y-3 min-h-96 p-4 rounded-lg border-2 border-dashed transition-colors duration-300 ${
                isDarkMode ? 'border-gray-600' : 'border-gray-200'
              }`}>
                {/* Execution Order Indicator */}
                <div className={`flex items-center gap-2 mb-4 p-2 border rounded tour-execution-order transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-blue-900/20 border-blue-700' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <span className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    Execution Order:
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>1st</span>
                    <span className="text-blue-400">→</span>
                    <span className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>2nd</span>
                    <span className="text-blue-400">→</span>
                    <span className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>3rd...</span>
                  </div>
                </div>

                {transactions.map((tx, index) => (
                  <div
                    key={tx.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, tx.id)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`border rounded-lg p-4 shadow-sm transition-all cursor-move select-none ${
                      tx.isSequencerTx 
                        ? 'border-pink-400 ring-2 ring-pink-200 bg-pink-50' 
                        : draggedTx === tx.id 
                          ? 'border-pink-300 shadow-lg opacity-50' 
                          : dragOverIndex === index
                            ? isDarkMode 
                              ? 'border-pink-400 bg-pink-900/20'
                              : 'border-pink-400 bg-pink-50'
                            : isDarkMode
                              ? 'border-gray-600 bg-gray-700 hover:border-pink-400 hover:shadow-md'
                              : 'border-gray-200 bg-white hover:border-pink-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-bold">
                            #{index + 1}
                          </span>
                          <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {tx.symbol}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            tx.type === 'BUY' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {tx.type}
                          </span>
                          {tx.isSequencerTx && (
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-pink-100 text-pink-700">
                              🥪 SANDWICH
                            </span>
                          )}
                          {tx.sandwichPairId && (
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-700">
                              PAIRED
                            </span>
                          )}
                          <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            ⋮⋮
                          </span>
                        </div>
                        <div className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <div>Amount: <span className="font-semibold">{tx.amount} {tx.symbol}</span></div>
                          <div>Price: <span className="font-semibold">${tx.price.toLocaleString()}</span></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {tx.txId}
                        </div>
                        <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          ${(tx.amount * tx.price).toLocaleString()}
                        </div>
                        {!tx.isSequencerTx && tx.type === 'BUY' && (
                          <Button
                            onClick={() => handleQuickSandwich(index)}
                            size="sm"
                            className="tour-quick-sandwich mt-2 bg-orange-500 hover:bg-orange-600 text-xs"
                          >
                            🥪 Quick Sandwich
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                    <div className="text-4xl mb-2">📭</div>
                    <p>No transactions generated</p>
                    <Button onClick={generateNewRandomOrder} className="mt-2">
                      Generate Random Orders
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="mt-6 flex justify-center">
            <Button 
              onClick={handleSubmitBlock}
              disabled={transactions.length === 0}
              className="tour-submit-button bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white px-8 py-3 text-lg font-semibold"
            >
              🚀 Submit & Calculate Sandwich Profits
            </Button>
          </div>
        </div>

        {/* Statistics Panel */}
        <div className="lg:col-span-1">
          <Card className={`mb-6 tour-statistics transition-colors duration-300 ${
            isDarkMode ? 'border-pink-700 bg-gray-800' : 'border-pink-200'
          }`}>
            <CardHeader className={`border-b transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-pink-900/20 border-pink-700' 
                : 'bg-pink-50 border-pink-200'
            }`}>
              <CardTitle className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                📊 Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className={`border rounded-lg p-3 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-blue-900/20 border-blue-700' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="text-2xl font-bold text-blue-600">{reorderedCount}</div>
                  <div className="text-sm text-blue-600">Reorders Made</div>
                </div>
                <div className={`border rounded-lg p-3 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-red-900/20 border-red-700' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="text-2xl font-bold text-red-600">{censoredCount}</div>
                  <div className="text-sm text-red-600">Txs Censored</div>
                </div>
                <div className={`border rounded-lg p-3 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-pink-900/20 border-pink-700' 
                    : 'bg-pink-50 border-pink-200'
                }`}>
                  <div className="text-2xl font-bold text-pink-600">
                    {transactions.filter(tx => tx.isSequencerTx).length}
                  </div>
                  <div className="text-sm text-pink-600">Your Transactions</div>
                </div>
              </div>

              {/* Random Generation Info */}
              <div className={`border rounded-lg p-3 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-purple-900/20 border-purple-700' 
                  : 'bg-purple-50 border-purple-200'
              }`}>
                <div className={`text-xs font-semibold mb-2 ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-800'
                }`}>
                  🎲 Random Generation:
                </div>
                <div className={`text-xs space-y-1 ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-700'
                }`}>
                  <div>• 5-7 random transactions</div>
                  <div>• Random tokens & types</div>
                  <div>• Realistic price ranges</div>
                  <div>• Variable amounts</div>
                </div>
              </div>

              {/* Sandwich Strategy Guide */}
              <div className={`border rounded-lg p-3 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-orange-900/20 border-orange-700' 
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className={`text-xs font-semibold mb-2 ${
                  isDarkMode ? 'text-orange-400' : 'text-orange-800'
                }`}>
                  🥪 Sandwich Strategy:
                </div>
                <div className={`text-xs space-y-1 ${
                  isDarkMode ? 'text-orange-300' : 'text-orange-700'
                }`}>
                  <div>1. Add BUY before victim</div>
                  <div>2. Victim&apos;s transaction executes</div>
                  <div>3. Add SELL after victim</div>
                  <div>4. Profit = (Sell - Buy) × Amount</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trash Bin */}
          <Card className={`tour-censorship transition-colors duration-300 ${
            isDarkMode ? 'border-red-700 bg-gray-800' : 'border-red-200'
          }`}>
            <CardHeader className={`border-b transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-red-900/20 border-red-700' 
                : 'bg-red-50 border-red-200'
            }`}>
              <CardTitle className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                🗑️ Censorship Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div
                onDragOver={handleTrashDragOver}
                onDrop={handleTrashDrop}
                className={`min-h-32 border-2 border-dashed rounded-lg flex items-center justify-center p-4 transition-colors ${
                  draggedTx 
                    ? 'border-red-400 bg-red-100' 
                    : isDarkMode
                      ? 'border-red-600 bg-red-900/20 hover:bg-red-900/30'
                      : 'border-red-300 bg-red-50 hover:bg-red-100'
                }`}
              >
                <div className="text-center text-red-600">
                  <div className="text-4xl mb-2">🗑️</div>
                  <p className="text-sm font-medium">Drop transactions here</p>
                  <p className="text-xs text-red-500">to censor them</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results Modal */}
      <AnimatePresence>
        {showResults && profitResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-6 rounded-t-lg">
                <h2 className="text-2xl font-bold">🥪 Sandwich Attack Results</h2>
                <p className="text-pink-100">Random order profit analysis</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`border rounded-lg p-4 transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-green-900/20 border-green-700' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="text-2xl font-bold text-green-600">
                      ${profitResults.grossProfit.toFixed(2)}
                    </div>
                    <div className="text-sm text-green-600">Total Profit</div>
                  </div>
                  <div className={`border rounded-lg p-4 transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-purple-900/20 border-purple-700' 
                      : 'bg-purple-50 border-purple-200'
                  }`}>
                    <div className="text-2xl font-bold text-purple-600">
                      {profitResults.sandwichPairs}
                    </div>
                    <div className="text-sm text-purple-600">Sandwich Pairs</div>
                  </div>
                </div>

                <div className={`border rounded-lg p-4 transition-colors duration-300 ${
                  profitResults.netProfit >= 0 
                    ? isDarkMode 
                      ? 'bg-green-900/20 border-green-700' 
                      : 'bg-green-50 border-green-200'
                    : isDarkMode 
                      ? 'bg-red-900/20 border-red-700' 
                      : 'bg-red-50 border-red-200'
                }`}>
                  <div className={`text-3xl font-bold ${
                    profitResults.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${profitResults.netProfit.toFixed(2)}
                  </div>
                  <div className={`text-lg ${
                    profitResults.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Net Profit
                  </div>
                  <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {profitResults.netProfit > 0 
                      ? "🎉 Successful sandwich attacks on random orders!" 
                      : profitResults.netProfit < 0
                        ? "😞 Sandwich attacks resulted in loss"
                        : "😐 Break-even"}
                  </div>
                </div>

                {/* Detailed Profit Breakdown */}
                {profitResults.profitBreakdown && profitResults.profitBreakdown.length > 0 && (
                  <div className="space-y-3">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      📋 Detailed Breakdown
                    </h3>
                    <div className="space-y-2">
                      {profitResults.profitBreakdown.map((item: ProfitBreakdownItem, index: number) => (
                        <div key={index} className={`p-4 rounded-lg border transition-colors duration-300 ${
                          item.profit > 0 
                            ? isDarkMode 
                              ? 'bg-green-900/20 border-green-700' 
                              : 'bg-green-50 border-green-200'
                            : item.profit < 0 
                              ? isDarkMode 
                                ? 'bg-red-900/20 border-red-700' 
                                : 'bg-red-50 border-red-200'
                              : isDarkMode 
                                ? 'bg-gray-700 border-gray-600' 
                                : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                {item.txId}
                              </div>
                              <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {item.strategy}
                              </div>
                              {item.buyPrice && item.sellPrice && (
                                <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Buy: ${item.buyPrice} → Sell: ${item.sellPrice} × {item.amount} tokens
                                </div>
                              )}
                            </div>
                            <div className={`font-bold text-lg ${
                              item.profit > 0 ? 'text-green-600' : 
                              item.profit < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              ${item.profit.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`border rounded-lg p-4 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-yellow-900/20 border-yellow-700' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-start space-x-2">
                    <div className="text-yellow-600 text-lg">🎲</div>
                    <div>
                      <div className={`font-semibold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>
                        Random Order Analysis
                      </div>
                      <div className={`text-sm mt-1 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                        Analysis of {profitResults.sequencerTxCount} sandwich transactions on randomly generated orders. 
                        Each reset creates new opportunities with different tokens, amounts, and prices!
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={() => setShowResults(false)}
                    className="flex-1 bg-pink-600 hover:bg-pink-700"
                  >
                    Continue Trading
                  </Button>
                  <Button 
                    onClick={generateNewRandomOrder}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    🎲 New Random Orders
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Export with client-side only rendering
export default function FrontRunningSimulation() {
  return <SandwichAttackComponent />;
}
