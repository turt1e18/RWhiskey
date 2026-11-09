import type { Preview } from '@storybook/nextjs-vite';
import './preview.css';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
    controls: { expanded: true },
    viewport: {
      options: {
        phone375: { name: '모바일 375px', styles: { width: '375px', height: '812px' }, type: 'mobile' },
        desktop1920: { name: '데스크톱 1920px', styles: { width: '1920px', height: '1080px' }, type: 'desktop' },
      },
    },
  },
};
export default preview;
