javascript
import React, { useState } from 'react';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>💰</div>
          
          <h1 style={{
            color: 'white',
            fontSize: '32px',
            margin: '0 0 10px',
            fontWeight: 'bold'
          }}>FinanceOS</h1>
          
          <p style={{
            color: '#ccc',
            margin: '0 0 30px',
            fontSize: '16px'
          }}>Personal Finance Operating System</p>
          
          <button 
            onClick={() => setIsLoggedIn(true)}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: '600',
              width: '100%'
            }}
          >
            Enter Demo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <header style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        padding: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{
          color: 'white',
          margin: 0,
          fontSize: '24px'
        }}>💰 FinanceOS</h1>
        
        <button 
          onClick={() => setIsLoggedIn(false)}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </header>
      
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '40px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h2 style={{
            color: 'white',
            fontSize: '28px',
            margin: '0 0 20px'
          }}>🎉 FinanceOS Dashboard</h2>
          
          <p style={{
            color: '#ccc',
            fontSize: '18px',
            margin: '0 0 30px'
          }}>
            Your personal finance operating system is running successfully!
          </p>
          
          <div style={{
            display: 'grid',
            gap: '20px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            marginTop: '30px'
          }}>
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
              <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>Dashboard</div>
            </div>
            
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📤</div>
              <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>Upload CSV</div>
            </div>
            
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
              <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>Goals</div>
            </div>
            
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🤖</div>
              <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>AI Coach</div>
            </div>
          </div>
          
          <p style={{
            color: '#10b981',
            marginTop: '30px',
            fontSize: '14px'
          }}>
            ✅ FinanceOS is working perfectly! Ready for your bank statements.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;