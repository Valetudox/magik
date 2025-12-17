---
to: tests/e2e/backend-<%= domain %>-e2e/schemathesis-tests/pytest.ini
---
[pytest]
testpaths = .
python_files = test_*.py
python_classes = Test*
python_functions = test_*
