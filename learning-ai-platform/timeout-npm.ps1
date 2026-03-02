#!/usr/bin/env pwsh

param(
    [Parameter(Mandatory=$true)][string]$Command,
    [int]$TimeoutSeconds = 120,  # Default timeout: 2 minutes
    [string]$WorkingDirectory = $PWD
)

$ErrorActionPreference = "Stop"

# Log the command and timeout
Write-Host "Executing command: npm $Command"
Write-Host "Timeout set to: $TimeoutSeconds seconds"
Write-Host "Working directory: $WorkingDirectory"

# Create a timer to track execution time
$timer = [System.Diagnostics.Stopwatch]::StartNew()

# Start the NPM command in a new process
$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = "npm"
$processInfo.Arguments = $Command -split " "
$processInfo.WorkingDirectory = $WorkingDirectory
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true
$processInfo.UseShellExecute = $false
$processInfo.CreateNoWindow = $true

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $processInfo
$process.Start() | Out-Null

# Create a background job to read output while waiting
$outputJob = Start-Job -ScriptBlock {
    param($process)
    while (-not $process.HasExited) {
        if ($process.StandardOutput.Peek() -ge 0) {
            Write-Output $process.StandardOutput.ReadToEnd()
        }
        if ($process.StandardError.Peek() -ge 0) {
            Write-Error $process.StandardError.ReadToEnd()
        }
        Start-Sleep -Milliseconds 100
    }
    # Read any remaining output
    if ($process.StandardOutput.Peek() -ge 0) {
        Write-Output $process.StandardOutput.ReadToEnd()
    }
    if ($process.StandardError.Peek() -ge 0) {
        Write-Error $process.StandardError.ReadToEnd()
    }
} -ArgumentList $process

# Wait for the process to complete or timeout
$completed = $process.WaitForExit($TimeoutSeconds * 1000)

# Stop the timer
$timer.Stop()

# Get the output from the background job
$output = Receive-Job -Job $outputJob -Wait
Remove-Job -Job $outputJob

# Display the output
if ($output) {
    Write-Host $output
}

if (-not $completed) {
    # Process exceeded timeout, kill it
    Write-Host "Command execution timed out after $($timer.Elapsed.TotalSeconds) seconds. Terminating process..."
    try {
        $process.Kill()
        Write-Host "Process terminated."
    } catch {
        Write-Host "Error terminating process: $_"
    }
    exit 1
} else {
    # Process completed within timeout
    Write-Host "Command completed in $($timer.Elapsed.TotalSeconds) seconds."
    exit $process.ExitCode
}
