#!/bin/bash
node src/server.js 2>&1 | tee server-debug.log
