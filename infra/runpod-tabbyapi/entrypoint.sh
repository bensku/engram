#!/bin/bash
set -euo pipefail

# Prepare tabbyAPI configuration
echo "network:
  host: 0.0.0.0
  port: 5000

model:
  model_dir: /workspace
  model_name: $MODEL_NAME
  max_seq_len: ${MAX_SEQ_LEN:-4096}" >/opt/tabbyAPI/config.yml

echo "api_key: $TABBY_API_KEY
admin_key: $TABBY_ADMIN_KEY" >/opt/tabbyAPI/api_tokens.yml

# Pull model huggingface CLI if it doesn't exist yet
cd /workspace
if [ ! -d $MODEL_NAME ]; then
  HF_HUB_ENABLE_HF_TRANSFER=1 huggingface-cli download $MODEL_PATH --local-dir $MODEL_NAME --local-dir-use-symlinks False
fi

# Start tabbyAPI
cd /opt/tabbyAPI
python main.py