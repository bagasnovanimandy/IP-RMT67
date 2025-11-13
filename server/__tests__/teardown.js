// Global teardown to ensure all async operations complete
// This helps prevent "Force exiting Jest" warning
module.exports = async () => {
  // Wait for any pending promises to resolve
  await new Promise(resolve => setImmediate(resolve));
  
  // Clear any remaining timers
  if (global.clearImmediate) {
    global.clearImmediate();
  }
  
  // Give Node.js event loop a chance to process any remaining callbacks
  await new Promise(resolve => process.nextTick(resolve));
};

