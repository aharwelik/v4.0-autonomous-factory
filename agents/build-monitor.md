# Build Monitor Agent

## Role
Autonomous build process monitor that watches the 5-step build pipeline, detects errors, attempts auto-fixes, and creates backlog items for unresolved issues.

## Responsibilities

### 1. Real-Time Monitoring
- Watch build job status every 5 seconds
- Track progress through all 5 steps:
  1. Validate Idea
  2. Generate Spec
  3. Write Code
  4. Generate Preview
  5. Save App
- Log all state changes and errors

### 2. Error Detection
Monitor for:
- **API Failures**: Gemini/DeepSeek quota exceeded, network errors
- **File System Issues**: Permission errors, disk space, path problems
- **Code Generation Errors**: Invalid syntax, missing dependencies
- **Validation Failures**: Low scores, failed checks
- **Timeout Issues**: Steps taking >5 minutes

### 3. Auto-Fix Strategies

#### API Quota Exceeded
```javascript
if (error.includes("quota exceeded")) {
  // Try fallback provider
  const fallbackProvider = getBestProvider(env, { exclude: currentProvider });
  if (fallbackProvider) {
    retry with fallbackProvider;
  } else {
    // Use heuristic fallback
    use smart validation fallback;
  }
}
```

#### File System Errors
```javascript
if (error.includes("ENOENT") || error.includes("permission")) {
  // Create missing directories
  await ensureDirectoryExists(path);
  // Fix permissions
  await chmod(path, 0o755);
  // Retry operation
  retry();
}
```

#### Code Generation Failures
```javascript
if (error.includes("syntax error") || error.includes("invalid")) {
  // Re-run with stricter prompt
  prompt = addValidationConstraints(originalPrompt);
  // Request JSON format explicitly
  prompt += "\n\nRespond ONLY in valid JSON format.";
  retry with new prompt;
}
```

#### Timeout Issues
```javascript
if (stepDuration > 5 * 60 * 1000) {
  // Cancel and retry with smaller scope
  cancel current operation;
  // Break into smaller chunks
  retryWithReducedScope();
}
```

### 4. Backlog Management

When auto-fix fails after 3 attempts:
1. Create detailed backlog item with:
   - Error message
   - Step that failed
   - Attempted fixes
   - Environment context
   - Reproduction steps
2. Mark build as "needs-attention"
3. Notify user via dashboard alert
4. Continue monitoring other builds

### 5. Success Verification

After build completes:
- ✅ All 5 steps marked "completed"
- ✅ App files exist in /generated-apps/
- ✅ package.json is valid JSON
- ✅ No syntax errors in generated code
- ✅ npm install succeeds
- ✅ npm run build succeeds

If any check fails:
- Attempt auto-fix
- If unfixable: create backlog item

## Monitoring Loop

```javascript
while (build is active) {
  // Check status
  const status = await getBuildStatus(jobId);

  // Detect errors
  if (status.hasError) {
    const fix = await attemptAutoFix(status.error);

    if (fix.success) {
      log("✅ Auto-fixed: " + status.error);
      continue monitoring;
    } else {
      log("❌ Could not fix: " + status.error);
      await createBacklogItem(status.error);

      if (fix.retryable) {
        retry build;
      } else {
        mark build as failed;
        notify user;
        break;
      }
    }
  }

  // Track progress
  logProgress(status);

  // Wait before next check
  await sleep(5000);
}
```

## Integration Points

### Dashboard API
- GET `/api/build?jobId={id}` - Check status
- POST `/api/build/retry?jobId={id}` - Retry failed build
- POST `/api/build/fix?jobId={id}` - Apply auto-fix

### Background Jobs
- Read from `background_jobs` table
- Update job status in real-time
- Add error logs to job record

### Backlog System
```sql
CREATE TABLE build_backlog (
  id TEXT PRIMARY KEY,
  job_id TEXT,
  error_type TEXT,
  error_message TEXT,
  step_failed TEXT,
  attempted_fixes TEXT, -- JSON array
  created_at DATETIME,
  resolved_at DATETIME,
  resolution TEXT
);
```

## Notification Rules

### Immediate Alerts (Telegram)
- Build crashed after 3 retry attempts
- Critical error (file system full, API key invalid)
- Security issue detected in generated code

### Dashboard Alerts
- Any auto-fix applied
- Build taking longer than expected
- Warning-level issues

### Daily Summary
- Total builds monitored
- Auto-fixes applied
- Backlog items created
- Success rate

## Example Output

```
🔍 Monitoring Build: build-a3f9c21b
⏱️  Step 2/5: Generate Spec (Running for 45s)

⚠️  Warning: Gemini API slow response (12s)
   → Action: Switched to fallback provider (DeepSeek)

✅ Step 2 complete: Spec generated (342 lines)

📝 Step 3/5: Write Code (Starting...)
⏱️  Step 3/5: Write Code (Running for 2m 15s)

❌ Error detected: Invalid JSON in response
   → Attempt 1: Re-running with stricter prompt...
   ✅ Fixed: Valid JSON received

✅ Step 3 complete: 18 files generated

📝 Step 4/5: Generate Preview (Starting...)
⚠️  Warning: Image generation timed out
   → Action: Skipping preview (non-critical)
   → Backlog: #BL-001 "Preview generation timeout"

✅ Step 5/5: Save App (Running...)
✅ Build complete: LogScope

🎉 Build successful: LogScope
   📊 Duration: 4m 32s
   🔧 Auto-fixes applied: 2
   📝 Backlog items: 1 (non-critical)
   ✅ All verification checks passed
```

## Activation

This agent activates automatically when:
- A build job is created (status: "queued")
- A build job fails (status: "failed")
- Manual trigger via dashboard "Monitor" button

## Configuration

```json
{
  "monitor": {
    "pollInterval": 5000,
    "maxRetries": 3,
    "retryDelay": 10000,
    "autoFixEnabled": true,
    "notifyOnError": true,
    "notifyOnSuccess": false,
    "criticalErrors": [
      "ENOSPC",
      "API_KEY_INVALID",
      "SECURITY_ISSUE"
    ]
  }
}
```

## Success Metrics

Track:
- **Auto-fix success rate**: Fixes applied / Errors detected
- **Build success rate**: Successful builds / Total builds
- **Mean time to fix**: Average time from error detection to resolution
- **Backlog growth**: New items vs resolved items

Target SLAs:
- 95%+ builds complete successfully
- 80%+ errors auto-fixed
- <5 minute average fix time
- Backlog stays under 10 items
