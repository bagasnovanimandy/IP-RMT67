// Test runner script to suppress "Force exiting Jest" warning while preserving ANSI colors
const { spawn } = require('child_process');

const jest = spawn('jest', [
  '--verbose',
  '--coverage',
  '--forceExit',
  '--colors' // Ensure colors are enabled
], {
  shell: true
});

// Buffer to handle incomplete lines (to preserve ANSI codes that might span chunks)
let stdoutBuffer = '';
let stderrBuffer = '';

// Process stdout while preserving ANSI escape codes
jest.stdout.on('data', (chunk) => {
  // Append chunk to buffer
  stdoutBuffer += chunk.toString();
  
  // Split by newline, but keep the last incomplete line in buffer
  const lines = stdoutBuffer.split(/\r?\n/);
  stdoutBuffer = lines.pop() || ''; // Keep incomplete line for next chunk
  
  // Process complete lines
  lines.forEach(line => {
    // Only filter if line contains the unwanted message
    // This preserves ANSI codes in other lines
    if (!line.includes('Force exiting Jest') && 
        !line.includes('Have you considered using --detectOpenHandles')) {
      process.stdout.write(line + '\n');
    }
  });
});

// Process stderr while preserving ANSI escape codes
jest.stderr.on('data', (chunk) => {
  // Append chunk to buffer
  stderrBuffer += chunk.toString();
  
  // Split by newline, but keep the last incomplete line in buffer
  const lines = stderrBuffer.split(/\r?\n/);
  stderrBuffer = lines.pop() || ''; // Keep incomplete line for next chunk
  
  // Process complete lines
  lines.forEach(line => {
    // Only filter if line contains the unwanted message
    if (!line.includes('Force exiting Jest') && 
        !line.includes('Have you considered using --detectOpenHandles')) {
      process.stderr.write(line + '\n');
    }
  });
});

// Flush remaining buffers on close
jest.on('close', (code) => {
  // Flush any remaining stdout buffer
  if (stdoutBuffer && 
      !stdoutBuffer.includes('Force exiting Jest') && 
      !stdoutBuffer.includes('Have you considered using --detectOpenHandles')) {
    process.stdout.write(stdoutBuffer);
  }
  
  // Flush any remaining stderr buffer
  if (stderrBuffer && 
      !stderrBuffer.includes('Force exiting Jest') && 
      !stderrBuffer.includes('Have you considered using --detectOpenHandles')) {
    process.stderr.write(stderrBuffer);
  }
  
  process.exit(code);
});

