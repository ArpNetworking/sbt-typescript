#!/bin/sh

# Copyright 2018 Ville Koskela
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# For documentation please refer to:
# https://github.com/KoskiLabs/jdk-wrapper/blob/master/README.md

HTTP_PROTOCOL="http"
FILE_PROTOCOL="file"

LATEST_RELEASE="latest"
SNAPSHOT_RELEASE="snapshot"

log_err() {
  l_prefix=$(date  +'%H:%M:%S')
  printf "[%s] %s\\n" "${l_prefix}" "$@" 1>&2;
}

log_out() {
  if [ -n "${JDKW_VERBOSE}" ]; then
    l_prefix=$(date  +'%H:%M:%S')
    printf "[%s] %s\\n" "${l_prefix}" "$@"
  fi
}

safe_command() {
  l_command=$1
  log_out "${l_command}";
  eval $1
  l_result=$?
  if [ "${l_result}" -ne "0" ]; then
    log_err "ERROR: ${l_command} failed with ${l_result}"
    exit 1
  fi
}

checksum() {
  l_file="$1"
  l_checksum_exec=""
  l_checksum_args=""
  if command -v sha256sum > /dev/null; then
    l_checksum_exec="sha256sum"
  elif command -v shasum > /dev/null; then
    l_checksum_exec="shasum"
    l_checksum_args="-a 256"
  elif command -v sha1sum > /dev/null; then
    l_checksum_exec="sha1sum"
  elif command -v md5 > /dev/null; then
    l_checksum_exec="md5"
  fi
  if [ -z "${l_checksum_exec}" ]; then
    log_err "ERROR: No supported checksum command found!"
    exit 1
  fi
  ${l_checksum_exec} ${l_checksum_args} < "${l_file}"
}

rand() {
  awk 'BEGIN {srand();printf "%d\n", (rand() * 10^8);}'
}

get_protocol() {
  case "${JDKW_BASE_URI}" in
  http://*|https://*)
    printf "%s" "${HTTP_PROTOCOL}"
    ;;
  file://*)
    printf "%s" "${FILE_PROTOCOL}"
    ;;
  *)
    log_err "ERROR: Unsupported protocol in JDKW_BASE_URI: ${JDKW_BASE_URI}"
    exit 1
  esac
}

obtain_if_needed() {
  l_file="$1"
  l_target_path="$2"
  if [ ! -f "${l_target_path}/${l_file}" ]; then
    case "${JDKW_BASE_URI}" in
    http://*|https://*)
      l_jdkw_url="${JDKW_BASE_URI}/releases/download/${JDKW_RELEASE}/${l_file}"
      log_out "Downloading ${l_file} from ${l_jdkw_url}"
      safe_command "curl ${curl_options} -f -k -L -o \"${l_target_path}/${l_file}\" \"${l_jdkw_url}\""
      ;;
    file://*)
      l_jdkw_path="${JDKW_BASE_URI#file://}/${l_file}"
      log_out "Copying ${l_file} from ${l_jdkw_path}"
      safe_command "cp \"${l_jdkw_path}\" \"${l_target_path}/${l_file}\""
      ;;
    *)
      log_err "ERROR: Unsupported protocol in JDKW_BASE_URI: ${JDKW_BASE_URI}"
      exit 1
    esac
    safe_command "chmod +x \"${l_target_path}/${l_file}\""
  fi
}

# Default curl options
curl_options=""

# Process (but do not load) properties from environment
env_configuration=
l_fifo="${TMPDIR:-/tmp}/$$.$(rand)"
safe_command "mkfifo \"${l_fifo}\""
env > "${l_fifo}" &
while IFS='=' read -r name value
do
  jdkw_arg=$(echo "${name}" | grep '^JDKW_.*')
  jdkw_base_dir_arg=$(echo "${name}" | grep '^JDKW_BASE_DIR')
  if [ -n "${jdkw_base_dir_arg}" ]; then
    eval "${name}=\"${value}\""
  fi
  if [ -n "${jdkw_arg}" ]; then
    env_configuration="${env_configuration}${name}=\"${value}\" "
  fi
done < "${l_fifo}"
safe_command "rm \"${l_fifo}\""

# Process (but do not load) properties from command line arguments
cmd_configuration=
for arg in "$@"; do
  jdkw_arg=$(echo "${arg}" | grep '^JDKW_.*')
  jdkw_base_dir_arg=$(echo "${arg}" | grep '^JDKW_BASE_DIR.*')
  if [ -n "${jdkw_base_dir_arg}" ]; then
    eval ${arg}
  fi
  if [ -n "${jdkw_arg}" ]; then
    cmd_configuration="${cmd_configuration}${arg} "
  fi
done

# Default base directory to current working directory
if [ -z "${JDKW_BASE_DIR}" ]; then
    JDKW_BASE_DIR="."
fi

# Load properties file in home directory
if [ -f "${HOME}/.jdkw" ]; then
  . "${HOME}/.jdkw"
fi

# Load properties file in base directory
if [ -f "${JDKW_BASE_DIR}/.jdkw" ]; then
  . "${JDKW_BASE_DIR}/.jdkw"
fi

# Load properties from environment
eval "${env_configuration}"

# Load properties from command line arguments
eval "${cmd_configuration}"

# Process configuration
if [ -z "${JDKW_BASE_URI}" ]; then
    JDKW_BASE_URI="https://github.com/KoskiLabs/jdk-wrapper"
fi
if [ -z "${JDKW_RELEASE}" ]; then
  JDKW_RELEASE="${LATEST_RELEASE}"
  if [ $(get_protocol) = "${FILE_PROTOCOL}" ]; then
    JDKW_RELEASE="${SNAPSHOT_RELEASE}"
  fi
  log_out "Defaulted to version ${JDKW_RELEASE}"
fi
if [ -z "${JDKW_TARGET}" ]; then
  JDKW_TARGET="${HOME}/.jdk"
  log_out "Defaulted to target ${JDKW_TARGET}"
fi
if [ -z "${JDKW_VERBOSE}" ]; then
  curl_options="${curl_options} --silent"
fi

# Resolve latest version
if [ "${JDKW_RELEASE}" = "${LATEST_RELEASE}" ]; then
  latest_version_json="${TMPDIR:-/tmp}/jdkw-latest-version-$$.$(rand)"
  safe_command "curl ${curl_options} -f -k -L -o \"${latest_version_json}\" -H 'Accept: application/json' \"${JDKW_BASE_URI}/releases/latest\""
  JDKW_RELEASE=$(sed -e 's/.*"tag_name":"\([^"]*\)".*/\1/' < "${latest_version_json}")
  rm -f "${latest_version_json}"
  log_out "Resolved latest version to ${JDKW_RELEASE}"
fi

# Ensure target directory exists
jdkw_path="${JDKW_TARGET}/jdkw/${JDKW_RELEASE}"
if [ -d "${jdkw_path}" ] && [ "${JDKW_RELEASE}" = "${SNAPSHOT_RELEASE}" ]; then
  log_out "Removing target snapshot directory ${jdkw_path}"
  safe_command "rm -rf \"${jdkw_path}\""
fi
if [ ! -d "${jdkw_path}" ]; then
  log_out "Creating target directory ${jdkw_path}"
  safe_command "mkdir -p \"${jdkw_path}\""
fi

# Download the jdk wrapper version
jdkw_impl="jdkw-impl.sh"
jdkw_wrapper="jdk-wrapper.sh"
obtain_if_needed "${jdkw_impl}" "${jdkw_path}"
obtain_if_needed "${jdkw_wrapper}" "${jdkw_path}"

# Check whether this wrapper is the one specified for this version
jdkw_download="${jdkw_path}/${jdkw_wrapper}"
jdkw_current="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/$(basename "$0")"
if [ "$(checksum "${jdkw_download}")" != "$(checksum "${jdkw_current}")" ]; then
  printf "\e[0;31m[WARNING]\e[0m Your jdk-wrapper.sh file does not match the one in your JDKW_RELEASE.\n"
  printf "\e[0;32mUpdate your jdk-wrapper.sh to match by running:\e[0m\n"
  printf "cp \"%s\" \"%s\"\n" "${jdkw_download}" "${jdkw_current}"
  sleep 3
fi

# Execute the provided command
# NOTE: The requirements proved quite difficult to run this without exec.
# 1) Exit with the exit status of the child process
# 2) Allow running the wrapper in the background and terminating the child process
# 3) Allow the child process to read from standard input when not running in the background
exec "${jdkw_path}/${jdkw_impl}" "$@"

