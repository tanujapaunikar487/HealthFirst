#!/bin/bash
echo "Downloading DeepSeek model..."
echo "This will take 5-10 minutes (~4GB download)"
echo ""
ollama pull deepseek-r1:7b
echo ""
echo "✅ Model downloaded!"
echo "Verifying..."
ollama list
