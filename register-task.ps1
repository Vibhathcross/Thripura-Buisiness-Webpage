$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c run-server.bat" -WorkingDirectory "C:\Users\USER\.gemini\antigravity\scratch\thripura_offset_printers"
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit 0 -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
Register-ScheduledTask -TaskName 'ThripuraPrinters-AutoStart' -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description 'Auto-starts Thripura Offset Printers server on login via native cmd' -Force
