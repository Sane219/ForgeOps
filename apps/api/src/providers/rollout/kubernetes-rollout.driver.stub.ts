/**
 * Placeholder for a future KubernetesRolloutDriver.
 *
 * Real implementation will:
 *   - Apply generated K8s manifests via @kubernetes/client-node to a target cluster
 *   - Watch Deployment.status.conditions to map K8s state → RolloutStatus
 *   - Surface real failure reasons (ImagePullBackOff, OOMKilled, etc.)
 *   - Optionally drive an Argo CD sync instead of `kubectl apply`
 *
 * Wired in by setting PROVIDER_ROLLOUT=kubernetes and providing kubeconfig.
 */
export const KUBERNETES_ROLLOUT_DRIVER_TODO = true;
