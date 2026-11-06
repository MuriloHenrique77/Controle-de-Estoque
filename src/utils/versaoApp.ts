import appConfig from '../../app.json';

export function obterVersaoApp(): string {
  return appConfig.expo.version;
}
