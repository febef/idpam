#!/bin/sh
set -eu

data_dir=/var/lib/openldap/openldap-data

if [ ! -s "$data_dir/data.mdb" ]; then
  slapadd -f /etc/openldap/slapd.conf -l /etc/openldap/bootstrap.ldif
fi

exec slapd -f /etc/openldap/slapd.conf -h 'ldaps://0.0.0.0:6360/' -d 0
