#!/bin/bash
set -e

BASE_URL="${BASE_URL:-http://127.0.0.1:5225}"


cmd_requests() {
  local json_str exit_code=0
  json_str="$(curl --fail-with-body -s "$BASE_URL/api/requests")" || exit_code="$?"
  if [ "$exit_code" != "0" ]; then
    echo "$json_str"
    return "$exit_code"
  fi
  jq -r . <<< "$json_str"
}

cmd_delete() {
  local user_id="$1"
  local json_str exit_code=0
  json_str="$(curl --fail-with-body -s -X DELETE "$BASE_URL/api/friend?user_id=${user_id}")" || exit_code="$?"
  if [ "$exit_code" != "0" ]; then
    echo "$json_str"
    return "$exit_code"
  fi
  jq -r '.' <<< "$json_str"
}

cmd_approve() {
  local user_id="$1"
  local json_str exit_code=0
  json_str="$(curl --fail-with-body -s -X POST "$BASE_URL/api/approve?user_id=${user_id}")" || exit_code="$?"
  if [ "$exit_code" != "0" ]; then
    echo "$json_str"
    return "$exit_code"
  fi
  jq -r '.' <<< "$json_str"
}

cmd_help(){
  printf 'Usage: %s COMMAND

Commands:
  requests
  delete <user_id>
  approve <user_id>

  help
' "$0"
}

main(){
  local cmd="$1"
  shift 2>/dev/null || true
  [ "$cmd" == "" ] && cmd=help  # default command
  [ "$cmd" == "-h" ] || [ "$cmd" == "--help" ] && cmd=help
  if ! type "cmd_$cmd" >/dev/null 2>&1; then
    cmd_help
    return 1
  fi
  cmd_$cmd "$@"
}

main "$@"
