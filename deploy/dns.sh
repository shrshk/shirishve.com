#!/bin/sh
# Points shirishve.com and www.shirishve.com at GitHub Pages. Safe to run again: a record that
# already exists is left alone.
#
# Needs a Cloudflare API token with Zone DNS: Edit on shirishve.com, read from 1Password the same
# way as doodle-games deploy/air/cloudflare-tunnel.sh. The token is never printed or written to disk.
# Run it on the machine that has the 1Password helper:
#
#   ssh air 'sh -s' < deploy/dns.sh
#
# The records are DNS-only (not proxied), so GitHub can issue and renew the HTTPS certificate.
set -eu
ENVF=$HOME/apps/doodle-games/deploy/air/local.env
if [ -f "$ENVF" ]; then . "$ENVF"; fi
OP_VAULT=${OP_VAULT:-Home}
OPH=${OPH:-$HOME/apps/living-room-tv/storage/op-home}
CF_TOKEN_ITEM=${CF_TOKEN_ITEM:-cloudflare-api-token}
ZONE=shirishve.com
PAGES_HOST=shrshk.github.io
B=https://api.cloudflare.com/client/v4

CF_TOKEN=$("$OPH" read "op://$OP_VAULT/$CF_TOKEN_ITEM/credential" </dev/null)
api() { curl -sS -m 20 -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" "$@"; }
ZONE_ID=$(api "$B/zones?name=$ZONE" | /usr/bin/python3 -c "import json,sys; d=json.load(sys.stdin); assert d['success'], d['errors']; print(d['result'][0]['id'])")

add() { # type name content
  FOUND=$(api "$B/zones/$ZONE_ID/dns_records?type=$1&name=$2&content=$3" | /usr/bin/python3 -c "import json,sys; d=json.load(sys.stdin); assert d['success'], d['errors']; print(len(d['result']))")
  if [ "$FOUND" != "0" ]; then echo "exists   $1 $2 $3"; return; fi
  api -X POST "$B/zones/$ZONE_ID/dns_records" \
    --data "{\"type\":\"$1\",\"name\":\"$2\",\"content\":\"$3\",\"ttl\":300,\"proxied\":false,\"comment\":\"GitHub Pages: portfolio\"}" |
    /usr/bin/python3 -c "import json,sys; d=json.load(sys.stdin); assert d['success'], d['errors']; print('created  $1 $2 $3')"
}

# GitHub Pages addresses: https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site
for ip in 185.199.108.153 185.199.109.153 185.199.110.153 185.199.111.153; do add A "$ZONE" "$ip"; done
for ip in 2606:50c0:8000::153 2606:50c0:8001::153 2606:50c0:8002::153 2606:50c0:8003::153; do add AAAA "$ZONE" "$ip"; done
add CNAME "www.$ZONE" "$PAGES_HOST"
