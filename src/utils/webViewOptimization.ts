/**
 * WebView 优化工具
 * 用于检测运行环境并提供针对性的优化配置
 */

export const isRunningInApp = () => {
  // Capacitor 会注入全局变量
  return !!(window as any).Capacitor;
};

export const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  const platform = (window as any).Capacitor?.platform || 'web';
  
  return {
    platform,  // 'ios' | 'android' | 'web'
    isNativeApp: platform !== 'web',
    isIOS: platform === 'ios' || /iPhone|iPad|iPod/i.test(ua),
    isAndroid: platform === 'android' || /Android/i.test(ua),
    isIPad: /iPad/i.test(ua) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    isWebView: /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua) || 
               ua.includes('wv') || 
               ua.includes('WebView'),
  };
};

export const getChartOptimizationConfig = () => {
  const deviceInfo = getDeviceInfo();
  
  return {
    // 延迟渲染时间（WebView 需要更长时间计算容器尺寸）
    renderDelay: deviceInfo.isNativeApp || deviceInfo.isWebView ? 200 : 150,
    
    // 是否启用动画（WebView 中禁用动画提升性能）
    enableAnimation: !deviceInfo.isNativeApp && !deviceInfo.isWebView,
    
    // 图表采样率（数据点过多时降采样）
    samplingThreshold: deviceInfo.isNativeApp || deviceInfo.isWebView ? 50 : 100,
    
    // 硬件加速
    useHardwareAcceleration: true,
    
    // 设备信息
    deviceInfo,
  };
};
