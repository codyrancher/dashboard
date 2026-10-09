#!/bin/bash
# Throwaway diagnostic: samples CPU, memory and pressure every 10 seconds

prev=""
n=0

while :; do
  read -r _ u ni s i w q sq st _ < /proc/stat
  cur="$u $ni $s $i $w $q $sq $st"

  top_out=$(top -b -n 2 -d 10 -w 200 2>/dev/null)

  ts=$(date -u +%H:%M:%S)
  read -r l1 _ < /proc/loadavg
  mem=$(awk '/^MemTotal/{t=$2} /^MemAvailable/{a=$2} /^SwapTotal/{st=$2} /^SwapFree/{sf=$2} END{printf "used=%dM avail=%dM swap=%dM", (t-a)/1024, a/1024, (st-sf)/1024}' /proc/meminfo)

  if [ -n "$prev" ]; then
    cpu=$(echo "$prev $cur" | awk '{du=$9-$1+$10-$2; ds=$11-$3+$14-$6+$15-$7; di=$12-$4; dw=$13-$5; dst=$16-$8; tot=du+ds+di+dw+dst; if (tot > 0) printf "usr=%.0f sys=%.0f iow=%.0f idle=%.0f steal=%.0f", 100*du/tot, 100*ds/tot, 100*dw/tot, 100*di/tot, 100*dst/tot}')
  else
    cpu="usr=- sys=- iow=- idle=- steal=-"
  fi
  prev="$cur"

  pc=$(awk '/^some/{print $2}' /proc/pressure/cpu 2>/dev/null)
  pm=$(awk '/^some/{print $2}' /proc/pressure/memory 2>/dev/null)
  pio=$(awk '/^some/{print $2}' /proc/pressure/io 2>/dev/null)

  echo "RES $ts load=$l1 $cpu $mem psi_cpu_${pc:-na} psi_mem_${pm:-na} psi_io_${pio:-na}"

  # CPU by command over the last 10 seconds, in percent of one core
  echo "$top_out" | awk -v ts="$ts" '/^top -/{it++} it==2 && $1 ~ /^[0-9]+$/ {c[$12]+=$9} END{printf "TOP %s", ts; for (k in c) if (c[k] >= 5) printf " %s=%.0f", k, c[k]; printf "\n"}'

  n=$((n + 1))
  if [ $((n % 6)) -eq 0 ]; then
    ps -eo rss=,comm= | awk -v ts="$ts" '{m[$2]+=$1} END{printf "RSS %s", ts; for (k in m) if (m[k] >= 150000) printf " %s=%dM", k, m[k]/1024; printf "\n"}'
  fi
done
