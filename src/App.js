jsx
function App() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
      color: 'white',
      padding: '50px',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>🎉 FinanceOS is Working!</h1>
      <p>Your React app is live and running!</p>
      <button onClick={() => alert('Button clicked!')}>
        Test Button
      </button>
    </div>
  );
}

export default App;
