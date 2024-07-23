import React, { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';

const initialWallets = [
  { id: 'W1', staked: 1000, yieldEarned: 0, vested: 0, pendingWithdrawals: 0 },
  { id: 'W2', staked: 2000, yieldEarned: 0, vested: 0, pendingWithdrawals: 0 },
  { id: 'W3', staked: 3000, yieldEarned: 0, vested: 0, pendingWithdrawals: 0 },
  { id: 'W4', staked: 4000, yieldEarned: 0, vested: 0, pendingWithdrawals: 0 },
];

const FrontierStakingPool = () => {
  const [connected, setConnected] = useState(false);
  const [userWallet, setUserWallet] = useState(null);
  const [days, setDays] = useState(0);
  const [withdrawalTimer, setWithdrawalTimer] = useState(null);
  const [showReStakingPopup, setShowReStakingPopup] = useState(false);
  const [reStakingOptions, setReStakingOptions] = useState({
    yield: false,
    vested: false,
    pending: false
  });
  const [wallets, setWallets] = useState(initialWallets);

  const dailyInterestRate = 0.001; // 0.1%
  const crePrice = 1; // $1 per CRE
  const apy = 42;
  const stakingPeriod = 184; // days

  const calculateTVL = () => {
    return wallets.reduce((sum, wallet) => 
      sum + wallet.staked + wallet.yieldEarned + wallet.vested, 0) * crePrice;
  };

  const calculateTTP = () => {
    return wallets.reduce((sum, wallet) => 
      sum + wallet.staked + wallet.yieldEarned + wallet.vested, 0);
  };

  const [tvl, setTvl] = useState(calculateTVL());
  const [ttp, setTtp] = useState(calculateTTP());

  const connectWallet = () => {
    setConnected(true);
    setUserWallet(wallets[Math.floor(Math.random() * wallets.length)]);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setDays(prev => (prev + 1) % (stakingPeriod + 1));
      setWallets(prevWallets => {
        return prevWallets.map(wallet => {
          const dailyYield = wallet.staked * dailyInterestRate;
          let newYieldEarned = wallet.yieldEarned + dailyYield;
          let newVested = wallet.vested;
          
          if (days % 30 === 0) { // 매 30일마다 vesting
            newVested += newYieldEarned * 0.1; // 10% vesting
            newYieldEarned *= 0.9; // 남은 90%
          }
          
          return {
            ...wallet,
            yieldEarned: newYieldEarned,
            vested: newVested
          };
        });
      });
      
      setTvl(calculateTVL());
      setTtp(calculateTTP());
      
      if (userWallet) {
        setUserWallet(prevWallet => {
          const updatedWallet = wallets.find(w => w.id === prevWallet.id);
          return updatedWallet || prevWallet;
        });
      }
    }, 1000); // 1초마다 1일씩 증가 (데모 목적)

    return () => clearInterval(timer);
  }, [days, userWallet]);

  const calculateBalance = (wallet) => {
    return wallet.staked + wallet.yieldEarned + wallet.vested;
  };

  const handleReStaking = () => {
    setShowReStakingPopup(true);
  };

  const confirmReStaking = () => {
    if (userWallet) {
      setUserWallet(prevWallet => {
        let amountToReStake = 0;
        if (reStakingOptions.yield) {
          amountToReStake += prevWallet.yieldEarned;
          prevWallet.yieldEarned = 0;
        }
        if (reStakingOptions.vested) {
          amountToReStake += prevWallet.vested;
          prevWallet.vested = 0;
        }
        if (reStakingOptions.pending) {
          amountToReStake += prevWallet.pendingWithdrawals;
          prevWallet.pendingWithdrawals = 0;
        }
        return {
          ...prevWallet,
          staked: prevWallet.staked + amountToReStake
        };
      });

      setWallets(prevWallets => {
        return prevWallets.map(wallet => 
          wallet.id === userWallet.id ? userWallet : wallet
        );
      });
    }
    setShowReStakingPopup(false);
    setReStakingOptions({ yield: false, vested: false, pending: false });
  };

  const handleWithdrawal = () => {
    if (userWallet) {
      setUserWallet(prevWallet => {
        const totalWithdrawal = prevWallet.yieldEarned + prevWallet.vested;
        return {
          ...prevWallet,
          pendingWithdrawals: prevWallet.pendingWithdrawals + totalWithdrawal,
          yieldEarned: 0,
          vested: 0
        };
      });

      setWallets(prevWallets => {
        return prevWallets.map(wallet => 
          wallet.id === userWallet.id ? userWallet : wallet
        );
      });

      // 72시간 후에 지급
      setWithdrawalTimer(setTimeout(() => {
        setUserWallet(prevWallet => ({
          ...prevWallet,
          pendingWithdrawals: 0
        }));
        setWithdrawalTimer(null);
      }, 72 * 3600)); // 72초 후 (데모 목적)
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto bg-gray-50 font-sans">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800">Frontier Staking Pool</h1>
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">TVL</p>
            <p className="text-2xl font-bold text-indigo-600">${tvl.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">TTP</p>
            <p className="text-2xl font-bold text-indigo-600">{ttp.toLocaleString()} BCRE</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">APY</p>
            <p className="text-2xl font-bold text-indigo-600">{apy}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">Days to Maturity</p>
            <p className="text-2xl font-bold text-indigo-600">{stakingPeriod - days}</p>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">Daily Interest:</span> 0.1%
        </div>
      </div>

      {!connected ? (
        <button 
          onClick={connectWallet}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition duration-300"
        >
          <Wallet className="mr-2" /> Connect Wallet
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">My Staking</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Current Balance</p>
              <p className="text-xl font-bold text-indigo-600">{calculateBalance(userWallet).toFixed(2)} BCRE</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Staked Amount</p>
              <p className="text-xl font-bold text-indigo-600">{userWallet.staked.toFixed(2)} BCRE</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Yield Earned</p>
              <p className="text-xl font-bold text-indigo-600">{userWallet.yieldEarned.toFixed(2)} BCRE</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Vested</p>
              <p className="text-xl font-bold text-indigo-600">{userWallet.vested.toFixed(2)} BCRE</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Pending Withdrawal</p>
              <p className="text-xl font-bold text-indigo-600">{userWallet.pendingWithdrawals.toFixed(2)} BCRE</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button 
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
              onClick={handleReStaking}
            >
              Re-staking
            </button>
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
              Auto-compound
            </button>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
              Vesting
            </button>
            <button 
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
              onClick={handleWithdrawal}
              disabled={withdrawalTimer !== null}
            >
              Withdrawal
            </button>
          </div>
        </div>
      )}

      {showReStakingPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Select tokens to re-stake</h3>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reStakingOptions.yield}
                  onChange={() => setReStakingOptions(prev => ({...prev, yield: !prev.yield}))}
                  className="mr-2"
                />
                <span className="text-gray-700">Yield Earned ({userWallet.yieldEarned.toFixed(2)} BCRE)</span>
              </label>
            </div>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reStakingOptions.vested}
                  onChange={() => setReStakingOptions(prev => ({...prev, vested: !prev.vested}))}
                  className="mr-2"
                />
                <span className="text-gray-700">Vested ({userWallet.vested.toFixed(2)} BCRE)</span>
              </label>
            </div>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reStakingOptions.pending}
                  onChange={() => setReStakingOptions(prev => ({...prev, pending: !prev.pending}))}
                  className="mr-2"
                />
                <span className="text-gray-700">Pending Withdrawals ({userWallet.pendingWithdrawals.toFixed(2)} BCRE)</span>
              </label>
            </div>
            <div className="flex justify-end">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 transition duration-300"
                onClick={() => setShowReStakingPopup(false)}
              >
                Cancel
              </button>
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                onClick={confirmReStaking}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FrontierStakingPool;
