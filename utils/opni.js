import { base64Encode } from '@/utils/crypto';
import axios from 'axios';

/* eslint-disable */
const INSIGHTS_RESPONSE = {"isPartial":false,"isRunning":false,"rawResponse":{"took":337,"timed_out":false,"_shards":{"total":2,"successful":2,"skipped":0,"failed":0},"hits":{"total":1939,"max_score":null,"hits":[]},"aggregations":{"2":{"buckets":[{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":38}]},"key_as_string":"2021-07-20T08:45:00.000-07:00","key":1626795900000,"doc_count":38},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":66},{"key":"Suspicious","doc_count":6}]},"key_as_string":"2021-07-20T08:45:30.000-07:00","key":1626795930000,"doc_count":72},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":61},{"key":"Suspicious","doc_count":4}]},"key_as_string":"2021-07-20T08:46:00.000-07:00","key":1626795960000,"doc_count":65},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":69},{"key":"Suspicious","doc_count":4}]},"key_as_string":"2021-07-20T08:46:30.000-07:00","key":1626795990000,"doc_count":73},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":57},{"key":"Suspicious","doc_count":5}]},"key_as_string":"2021-07-20T08:47:00.000-07:00","key":1626796020000,"doc_count":62},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":36},{"key":"Suspicious","doc_count":3}]},"key_as_string":"2021-07-20T08:47:30.000-07:00","key":1626796050000,"doc_count":39},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":7}]},"key_as_string":"2021-07-20T08:48:00.000-07:00","key":1626796080000,"doc_count":7},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":26},{"key":"Suspicious","doc_count":2}]},"key_as_string":"2021-07-20T08:48:30.000-07:00","key":1626796110000,"doc_count":28},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":9}]},"key_as_string":"2021-07-20T08:49:00.000-07:00","key":1626796140000,"doc_count":9},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":6}]},"key_as_string":"2021-07-20T08:49:30.000-07:00","key":1626796170000,"doc_count":6},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":98},{"key":"Anomaly","doc_count":1}]},"key_as_string":"2021-07-20T08:50:00.000-07:00","key":1626796200000,"doc_count":99},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":59},{"key":"Suspicious","doc_count":5}]},"key_as_string":"2021-07-20T08:50:30.000-07:00","key":1626796230000,"doc_count":64},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":27},{"key":"Suspicious","doc_count":2}]},"key_as_string":"2021-07-20T08:51:00.000-07:00","key":1626796260000,"doc_count":29},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":73},{"key":"Suspicious","doc_count":5}]},"key_as_string":"2021-07-20T08:51:30.000-07:00","key":1626796290000,"doc_count":78},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":83},{"key":"Suspicious","doc_count":6}]},"key_as_string":"2021-07-20T08:52:00.000-07:00","key":1626796320000,"doc_count":89},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":89},{"key":"Suspicious","doc_count":3}]},"key_as_string":"2021-07-20T08:52:30.000-07:00","key":1626796350000,"doc_count":92},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":17},{"key":"Suspicious","doc_count":1}]},"key_as_string":"2021-07-20T08:53:00.000-07:00","key":1626796380000,"doc_count":18},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":27},{"key":"Suspicious","doc_count":3}]},"key_as_string":"2021-07-20T08:53:30.000-07:00","key":1626796410000,"doc_count":30},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":6}]},"key_as_string":"2021-07-20T08:54:00.000-07:00","key":1626796440000,"doc_count":6},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":6}]},"key_as_string":"2021-07-20T08:54:30.000-07:00","key":1626796470000,"doc_count":6},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":85},{"key":"Anomaly","doc_count":1}]},"key_as_string":"2021-07-20T08:55:00.000-07:00","key":1626796500000,"doc_count":86},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":26},{"key":"Suspicious","doc_count":2}]},"key_as_string":"2021-07-20T08:55:30.000-07:00","key":1626796530000,"doc_count":28},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":58},{"key":"Suspicious","doc_count":5}]},"key_as_string":"2021-07-20T08:56:00.000-07:00","key":1626796560000,"doc_count":63},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":16},{"key":"Suspicious","doc_count":1}]},"key_as_string":"2021-07-20T08:56:30.000-07:00","key":1626796590000,"doc_count":17},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":54},{"key":"Suspicious","doc_count":5}]},"key_as_string":"2021-07-20T08:57:00.000-07:00","key":1626796620000,"doc_count":59},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":626},{"key":"Suspicious","doc_count":23}]},"key_as_string":"2021-07-20T08:57:30.000-07:00","key":1626796650000,"doc_count":649},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":84},{"key":"Suspicious","doc_count":3}]},"key_as_string":"2021-07-20T08:58:00.000-07:00","key":1626796680000,"doc_count":87},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":16},{"key":"Suspicious","doc_count":1}]},"key_as_string":"2021-07-20T08:58:30.000-07:00","key":1626796710000,"doc_count":17},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":19},{"key":"Suspicious","doc_count":1}]},"key_as_string":"2021-07-20T08:59:00.000-07:00","key":1626796740000,"doc_count":20},{"3":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"Normal","doc_count":3}]},"key_as_string":"2021-07-20T08:59:30.000-07:00","key":1626796770000,"doc_count":3}]}}},"total":2,"loaded":2};
const ANOMOLY_RESPONSE = {"isPartial":false,"isRunning":false,"rawResponse":{"took":324,"timed_out":false,"_shards":{"total":2,"successful":2,"skipped":0,"failed":0},"hits":{"total":1939,"max_score":null,"hits":[]},"aggregations":{"2":{"buckets":[{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":36},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":2}}},"key_as_string":"2021-07-20T08:45:00.000-07:00","key":1626795900000,"doc_count":38},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":6},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":66}}},"key_as_string":"2021-07-20T08:45:30.000-07:00","key":1626795930000,"doc_count":72},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":4},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":61}}},"key_as_string":"2021-07-20T08:46:00.000-07:00","key":1626795960000,"doc_count":65},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":10},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":63}}},"key_as_string":"2021-07-20T08:46:30.000-07:00","key":1626795990000,"doc_count":73},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":6},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":56}}},"key_as_string":"2021-07-20T08:47:00.000-07:00","key":1626796020000,"doc_count":62},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":6},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":33}}},"key_as_string":"2021-07-20T08:47:30.000-07:00","key":1626796050000,"doc_count":39},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":6},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":1}}},"key_as_string":"2021-07-20T08:48:00.000-07:00","key":1626796080000,"doc_count":7},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":6},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":22}}},"key_as_string":"2021-07-20T08:48:30.000-07:00","key":1626796110000,"doc_count":28},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":8},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":1}}},"key_as_string":"2021-07-20T08:49:00.000-07:00","key":1626796140000,"doc_count":9},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":6},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":0}}},"key_as_string":"2021-07-20T08:49:30.000-07:00","key":1626796170000,"doc_count":6},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":1}}},"doc_count":97},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":2}}},"key_as_string":"2021-07-20T08:50:00.000-07:00","key":1626796200000,"doc_count":99},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":6},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":58}}},"key_as_string":"2021-07-20T08:50:30.000-07:00","key":1626796230000,"doc_count":64},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":6},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":23}}},"key_as_string":"2021-07-20T08:51:00.000-07:00","key":1626796260000,"doc_count":29},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":7},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":71}}},"key_as_string":"2021-07-20T08:51:30.000-07:00","key":1626796290000,"doc_count":78},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":4},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":85}}},"key_as_string":"2021-07-20T08:52:00.000-07:00","key":1626796320000,"doc_count":89},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":8},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":84}}},"key_as_string":"2021-07-20T08:52:30.000-07:00","key":1626796350000,"doc_count":92},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":6},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":12}}},"key_as_string":"2021-07-20T08:53:00.000-07:00","key":1626796380000,"doc_count":18},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":6},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":24}}},"key_as_string":"2021-07-20T08:53:30.000-07:00","key":1626796410000,"doc_count":30},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":5},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":1}}},"key_as_string":"2021-07-20T08:54:00.000-07:00","key":1626796440000,"doc_count":6},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":6},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":0}}},"key_as_string":"2021-07-20T08:54:30.000-07:00","key":1626796470000,"doc_count":6},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":1}}},"doc_count":85},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":1}}},"key_as_string":"2021-07-20T08:55:00.000-07:00","key":1626796500000,"doc_count":86},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":6},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":22}}},"key_as_string":"2021-07-20T08:55:30.000-07:00","key":1626796530000,"doc_count":28},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":6},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":57}}},"key_as_string":"2021-07-20T08:56:00.000-07:00","key":1626796560000,"doc_count":63},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":6},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":11}}},"key_as_string":"2021-07-20T08:56:30.000-07:00","key":1626796590000,"doc_count":17},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":3},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":56}}},"key_as_string":"2021-07-20T08:57:00.000-07:00","key":1626796620000,"doc_count":59},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":18},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":631}}},"key_as_string":"2021-07-20T08:57:30.000-07:00","key":1626796650000,"doc_count":649},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":8},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":79}}},"key_as_string":"2021-07-20T08:58:00.000-07:00","key":1626796680000,"doc_count":87},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":6},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":11}}},"key_as_string":"2021-07-20T08:58:30.000-07:00","key":1626796710000,"doc_count":17},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":8},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":12}}},"key_as_string":"2021-07-20T08:59:00.000-07:00","key":1626796740000,"doc_count":20},{"4":{"buckets":{"Control Plane Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":3},"Workload Anomaly":{"3":{"buckets":{" ":{"doc_count":0}}},"doc_count":0}}},"key_as_string":"2021-07-20T08:59:30.000-07:00","key":1626796770000,"doc_count":3}]}}},"total":2,"loaded":2};
const LOGS_RESPONSE = {"isPartial":false,"isRunning":false,"rawResponse":{"took":301,"timed_out":false,"_shards":{"total":2,"successful":2,"skipped":0,"failed":0},"hits":{"total":2,"max_score":null,"hits":[{"_index":"logs-000001","_type":"_doc","_id":"16267965058879340000000000000010110","_version":2,"_score":null,"_source":{"stream":"stderr","logtag":"F","message":"2021-07-20 15:55:04.746700 W | etcdserver/api/etcdhttp: /health error; QGET failed etcdserver: request timed out (status code 503)","kubernetes.pod_name":"etcd-cjackon-opni","kubernetes.namespace_name":"kube-system","kubernetes.pod_id":"ce9dd814-7049-4e67-88e2-f7378488f642","kubernetes.labels.component":"etcd","kubernetes.labels.tier":"control-plane","kubernetes.annotations.etcd-k3s-io/initial":"{\"initial-advertise-peer-urls\":\"https://198.199.117.108:2380\",\"initial-cluster\":\"cjackon-opni-c82ca1b2=https://198.199.117.108:2380\",\"initial-cluster-state\":\"new\"}","kubernetes.annotations.kubernetes-io/config-hash":"465348dc6b2e1a8ef401ab0e3d327974","kubernetes.annotations.kubernetes-io/config-mirror":"465348dc6b2e1a8ef401ab0e3d327974","kubernetes.annotations.kubernetes-io/config-seen":"2021-07-20T04:48:31.607517149Z","kubernetes.annotations.kubernetes-io/config-source":"file","kubernetes.annotations.kubernetes-io/psp":"global-unrestricted-psp","kubernetes.host":"cjackon-opni","kubernetes.container_name":"etcd","kubernetes.docker_id":"a87448d2b01374c82ff88bfb6e37a812b98734de02689cc86cb5cb139b93fb96","kubernetes.container_hash":"docker.io/rancher/hardened-etcd@sha256:8029d886dc07fa99df5739ca45b42ea443374b59a5ca4811b62f02c685041b27","kubernetes.container_image":"docker.io/rancher/hardened-etcd:v3.4.13-k3s1-build20210223","time_nanoseconds":1626796505887934000,"window_dt":1626796500000,"window_start_time_ns":1626796500000000000,"log":"2021-07-20 15:55:04.746700 W | etcdserver/api/etcdhttp: /health error; QGET failed etcdserver: request timed out (status code 503)","masked_log":"<utc_date> w etcdserver<path> : <path> error; qget failed etcdserver : request timed out status code <token_with_digit>","timestamp":1626796505887,"is_control_plane_log":true,"kubernetes_component":"etcd","anomaly_predicted_count":1,"nulog_anomaly":true,"drain_anomaly":false,"nulog_confidence":0.375,"drain_matched_template_id":-1,"drain_matched_template_support":-1,"anomaly_level":"Anomaly"},"fields":{"timestamp":["2021-07-20T15:55:05.887Z"]},"sort":[1626796505887]},{"_index":"logs-000001","_type":"_doc","_id":"16267962086187040000000000000000001","_version":2,"_score":null,"_source":{"stream":"stderr","logtag":"F","message":"2021-07-20 15:50:04.746177 W | etcdserver/api/etcdhttp: /health error; QGET failed etcdserver: request timed out (status code 503)","kubernetes.pod_name":"etcd-cjackon-opni","kubernetes.namespace_name":"kube-system","kubernetes.pod_id":"ce9dd814-7049-4e67-88e2-f7378488f642","kubernetes.labels.controller-revision-hash":"","kubernetes.labels.k8s-app":"","kubernetes.labels.pod-template-generation":"","kubernetes.annotations.kubernetes-io/psp":"global-unrestricted-psp","kubernetes.annotations.scheduler-alpha-kubernetes-io/critical-pod":"","kubernetes.host":"cjackon-opni","kubernetes.container_name":"etcd","kubernetes.docker_id":"a87448d2b01374c82ff88bfb6e37a812b98734de02689cc86cb5cb139b93fb96","kubernetes.container_hash":"docker.io/rancher/hardened-etcd@sha256:8029d886dc07fa99df5739ca45b42ea443374b59a5ca4811b62f02c685041b27","kubernetes.container_image":"docker.io/rancher/hardened-etcd:v3.4.13-k3s1-build20210223","kubernetes.labels.component":"etcd","kubernetes.labels.tier":"control-plane","kubernetes.annotations.etcd-k3s-io/initial":"{\"initial-advertise-peer-urls\":\"https://198.199.117.108:2380\",\"initial-cluster\":\"cjackon-opni-c82ca1b2=https://198.199.117.108:2380\",\"initial-cluster-state\":\"new\"}","kubernetes.annotations.kubernetes-io/config-hash":"465348dc6b2e1a8ef401ab0e3d327974","kubernetes.annotations.kubernetes-io/config-mirror":"465348dc6b2e1a8ef401ab0e3d327974","kubernetes.annotations.kubernetes-io/config-seen":"2021-07-20T04:48:31.607517149Z","kubernetes.annotations.kubernetes-io/config-source":"file","time_nanoseconds":1626796208618704000,"window_dt":1626796200000,"window_start_time_ns":1626796200000000000,"log":"2021-07-20 15:50:04.746177 W | etcdserver/api/etcdhttp: /health error; QGET failed etcdserver: request timed out (status code 503)","masked_log":"<utc_date> w etcdserver<path> : <path> error; qget failed etcdserver : request timed out status code <token_with_digit>","timestamp":1626796208618,"is_control_plane_log":true,"kubernetes_component":"etcd","anomaly_predicted_count":1,"nulog_anomaly":true,"drain_anomaly":false,"nulog_confidence":0.375,"drain_matched_template_id":-1,"drain_matched_template_support":-1,"anomaly_level":"Anomaly"},"fields":{"timestamp":["2021-07-20T15:50:08.618Z"]},"sort":[1626796208618]}]}},"total":2,"loaded":2};
const WORKLOAD_LOGS_RESPONSE = {"isPartial":false,"isRunning":false,"rawResponse":{"took":275,"timed_out":false,"_shards":{"total":2,"successful":2,"skipped":0,"failed":0},"hits":{"total":0,"max_score":null,"hits":[]}},"total":2,"loaded":2};
const INSIGHTS_QUERY = {"params":{"index":"logs*","body":{"aggs":{"2":{"date_histogram":{"field":"timestamp","fixed_interval":"30s","time_zone":"America/Phoenix","min_doc_count":1},"aggs":{"3":{"terms":{"field":"anomaly_level.keyword","order":{"_count":"desc"},"size":5}}}}},"size":0,"stored_fields":["*"],"script_fields":{},"docvalue_fields":[{"field":"time","format":"date_time"},{"field":"timestamp","format":"date_time"}],"_source":{"excludes":[]},"query":{"bool":{"must":[],"filter":[{"match_all":{}},{"range":{"timestamp":{"gte":"2021-07-22T22:26:39.049Z","lte":"2021-07-22T22:41:39.049Z","format":"strict_date_optional_time"}}}],"should":[],"must_not":[]}}},"preference":1626993045882}};
const ANOMOLY_QUERY = {"params":{"index":"logs*","body":{"aggs":{"2":{"date_histogram":{"field":"timestamp","fixed_interval":"30s","time_zone":"America/Phoenix","min_doc_count":1},"aggs":{"4":{"filters":{"filters":{"Control Plane Anomaly":{"bool":{"must":[{"query_string":{"query":"is_control_plane_log:true","analyze_wildcard":true,"time_zone":"America/Phoenix"}}],"filter":[],"should":[],"must_not":[]}},"Workload Anomaly":{"bool":{"must":[{"query_string":{"query":"is_control_plane_log:false","analyze_wildcard":true,"time_zone":"America/Phoenix"}}],"filter":[],"should":[],"must_not":[]}}}},"aggs":{"3":{"filters":{"filters":{" ":{"bool":{"must":[{"query_string":{"query":"anomaly_level:Anomaly","analyze_wildcard":true,"time_zone":"America/Phoenix"}}],"filter":[],"should":[],"must_not":[]}}}}}}}}}},"size":0,"stored_fields":["*"],"script_fields":{},"docvalue_fields":[{"field":"time","format":"date_time"},{"field":"timestamp","format":"date_time"}],"_source":{"excludes":[]},"query":{"bool":{"must":[],"filter":[{"match_all":{}},{"range":{"timestamp":{"gte":"2021-07-22T22:26:39.053Z","lte":"2021-07-22T22:41:39.053Z","format":"strict_date_optional_time"}}}],"should":[],"must_not":[]}}},"preference":1626993045882}}
const LOGS_QUERY = {"params":{"index":"logs*","body":{"version":true,"size":500,"sort":[{"timestamp":{"order":"desc","unmapped_type":"boolean"}}],"stored_fields":["*"],"script_fields":{},"docvalue_fields":[{"field":"time","format":"date_time"},{"field":"timestamp","format":"date_time"}],"_source":{"excludes":[]},"query":{"bool":{"must":[],"filter":[{"match_all":{}},{"match_all":{}},{"match_phrase":{"is_control_plane_log":true}},{"match_phrase":{"nulog_anomaly":true}},{"range":{"timestamp":{"gte":"2021-07-22T22:26:39.084Z","lte":"2021-07-22T22:41:39.084Z","format":"strict_date_optional_time"}}}],"should":[],"must_not":[{"match_phrase":{"anomaly_level":"Normal"}}]}},"highlight":{"pre_tags":["@kibana-highlighted-field@"],"post_tags":["@/kibana-highlighted-field@"],"fields":{"*":{}},"fragment_size":2147483647}},"preference":1626993045882}}
const WORKLOAD_LOGS_QUERY = {"params":{"index":"logs*","body":{"version":true,"size":500,"sort":[{"timestamp":{"order":"desc","unmapped_type":"boolean"}}],"stored_fields":["*"],"script_fields":{},"docvalue_fields":[{"field":"time","format":"date_time"},{"field":"timestamp","format":"date_time"}],"_source":{"excludes":[]},"query":{"bool":{"must":[{"match_all":{}}],"filter":[{"match_all":{}},{"match_phrase":{"is_control_plane_log":false}},{"match_phrase":{"nulog_anomaly":true}},{"range":{"timestamp":{"gte":"2021-07-22T22:26:39.086Z","lte":"2021-07-22T22:41:39.086Z","format":"strict_date_optional_time"}}}],"should":[],"must_not":[{"match_phrase":{"anomaly_level":"Normal"}}]}},"highlight":{"pre_tags":["@kibana-highlighted-field@"],"post_tags":["@/kibana-highlighted-field@"],"fields":{"*":{}},"fragment_size":2147483647}},"preference":1626993045882}};
/* eslint-enable */

export async function elasticRequest(query, fallback) {
  if (!location.search.includes('request')) {
    return fallback;
  }

  const headers = {
    Authorization: `Basic ${ base64Encode(`admin:admin`) }`,
    'kbn-xsrf':    'reporting'
  };

  const response = await axios.post('/internal/search/es', query, { headers });

  return response.data;
}

export async function getInsights() {
  const response = await elasticRequest(INSIGHTS_QUERY, INSIGHTS_RESPONSE);

  if (response.rawResponse.hits.total === 0) {
    return [];
  }

  return response.rawResponse.aggregations[2].buckets.map((bucket) => {
    const data = {};

    bucket[3].buckets.forEach((subBucket) => {
      data[subBucket.key] = subBucket.doc_count;
    });

    return {
      timestamp:  bucket.key,
      normal:     data.Normal || 0,
      suspicious: data.Suspicious || 0,
      anomoly:    data.Anomoly || 0
    };
  });
}

export async function getAnomolies() {
  const response = await elasticRequest(ANOMOLY_QUERY, ANOMOLY_RESPONSE);

  if (response.rawResponse.hits.total === 0) {
    return [];
  }

  return response.rawResponse.aggregations[2].buckets.map((bucket) => {
    const data = {};

    Object.entries(bucket[4].buckets).forEach(([key, value]) => {
      data[key] = value;
    });

    return {
      timestamp:           bucket.key,
      controlPlaneAnomaly: data['Control Plane Anomaly'].doc_count || 0,
      workloadAnomaly:     data['Workload Anomaly'].doc_count || 0,
    };
  });
}

export async function getLogs() {
  const response = await elasticRequest(LOGS_QUERY, LOGS_RESPONSE);

  if (response.rawResponse.hits.total === 0) {
    return [];
  }

  return response.rawResponse.hits.hits.map((hit) => {
    return {
      timestamp:  hit._source.timestamp.toString(),
      message:   hit._source.message.split('|')[1].trim(),
      level:     hit._source.anomaly_level,
      component: hit._source.kubernetes_component
    };
  });
}

export async function getWorkloadLogs() {
  const response = await elasticRequest(WORKLOAD_LOGS_QUERY, WORKLOAD_LOGS_RESPONSE);

  if (response.rawResponse.hits.total === 0) {
    return [];
  }

  return response.rawResponse.hits.hits.map((hit) => {
    return {
      timestamp:  hit._source.timestamp.toString(),
      message:   hit._source.message,
      level:     hit._source.anomaly_level,
      component: hit._source.kubernetes_component
    };
  });
}
