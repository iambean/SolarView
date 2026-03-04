export const OSS_BASE_URL = 'https://emox-uploads.oss-cn-shenzhen.aliyuncs.com/tmp';

export function ossAssetUrl(relativePath: string): string {
  const normalized = relativePath.replace(/^\/+/, '');
  return `${OSS_BASE_URL}/${normalized}`;
}
