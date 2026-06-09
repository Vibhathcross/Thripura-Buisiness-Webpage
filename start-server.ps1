$logFile = "C:\Users\USER\.gemini\antigravity\scratch\thripura_offset_printers\start-server.log"
"--- Script started at $(Get-Date) ---" | Out-File $logFile -Append

try {
    Set-Location "C:\Users\USER\.gemini\antigravity\scratch\thripura_offset_printers" -ErrorAction Stop
    "Set Location success" | Out-File $logFile -Append
    
    $ws = New-Object -ComObject WScript.Shell -ErrorAction Stop
    "WScript.Shell instantiated" | Out-File $logFile -Append
    
    $ws.Run("""C:\Program Files\nodejs\node.exe"" server.js", 0, $false)
    "WScript.Run executed successfully" | Out-File $logFile -Append
} catch {
    "ERROR: $_" | Out-File $logFile -Append
}
