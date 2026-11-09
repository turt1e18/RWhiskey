import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

addons.setConfig({
  theme: create({
    base: 'dark',
    brandTitle: 'R-Whiskey · 추천 화면 시안',
    appBg: '#17120f',
    appContentBg: '#1a120d',
    barBg: '#211b16',
    colorSecondary: '#c59f66',
  }),
  panelPosition: 'right',
});
