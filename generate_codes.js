#!/usr/bin/env node
// Simple script to generate activation codes (prints JSON array)
function randCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
const n = parseInt(process.argv[2] || "10", 10);
const codes = [];
for (let i=0;i<n;i++) codes.push(randCode());
console.log(JSON.stringify(codes, null, 2));