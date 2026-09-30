@echo off
REM ========================================================
REM Document Approval Workflow - Full Test Suite Runner
REM ========================================================

python run_tests.py
exit /b %ERRORLEVEL%
