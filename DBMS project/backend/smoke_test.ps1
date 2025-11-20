Start-Sleep -Seconds 1
Write-Output "Creating member..."
$m = @{ full_name='Alice Example'; email='alice@example.com' } | ConvertTo-Json
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/members -Method POST -Body $m -ContentType 'application/json' | ConvertTo-Json -Depth 10 | Write-Output
Write-Output "Creating book..."
$b = @{ title='The Demo Book'; author='Demo Author'; copies=2 } | ConvertTo-Json
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/books -Method POST -Body $b -ContentType 'application/json' | ConvertTo-Json -Depth 10 | Write-Output
Write-Output "Creating loan..."
$due = (Get-Date).AddDays(14).ToString('o')
$ln = @{ book_id=1; member_id=1; due_at=$due } | ConvertTo-Json
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/loans -Method POST -Body $ln -ContentType 'application/json' | ConvertTo-Json -Depth 10 | Write-Output
Write-Output "Books list:"
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/books | ConvertTo-Json -Depth 10 | Write-Output
Write-Output "Members list:"
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/members | ConvertTo-Json -Depth 10 | Write-Output
Write-Output "Loans list:"
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/loans | ConvertTo-Json -Depth 10 | Write-Output
