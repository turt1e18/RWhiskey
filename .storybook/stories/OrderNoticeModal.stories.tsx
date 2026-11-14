import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import OrderNoticeModal from '@/components/recommendations/OrderNoticeModal';

// Fixed examples of the action-required notices on /mood/verified; no login, API or DB is involved.
const meta = {
  id: 'whiskey-order-notice-modal',
  title: '위스키/주문 안내 모달',
  component: OrderNoticeModal,
  args: { kind: 'AUTH', message: '로그인이 필요합니다.', onRecover: fn(), onClose: fn() },
  argTypes: {
    kind: { name: '상황', options: ['AUTH', 'DAILY_LIMITED', 'RECOVER'], control: 'select' },
    message: { name: '서버 안내 문구 (RECOVER에서만 표시)', control: 'text' },
  },
  parameters: {
    docs: { description: { component: '주문 중 사용자가 행동해야 다음으로 갈 수 있는 상황에 나오는 모달입니다. 실제 화면에서는 로그인 만료·하루 한도·이전 주문 미확인 때 표시됩니다.' } },
  },
} satisfies Meta<typeof OrderNoticeModal>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Auth: Story = { name: '로그인 만료 (401/403)' };
export const DailyLimited: Story = { name: '오늘 추천 한도 소진', args: { kind: 'DAILY_LIMITED', message: '오늘 받을 수 있는 추천을 모두 사용했어요.' } };
export const Recover: Story = { name: '이전 주문 결과 확인 필요', args: { kind: 'RECOVER', message: '이전 주문의 결과를 아직 확인하지 못했어요. 결과를 먼저 확인한 뒤 새로 주문해 주세요.' } };
export const RecoverUnconfirmed: Story = { name: '응답 확인 실패 (네트워크)', args: { kind: 'RECOVER', message: '주문 결과를 확인하지 못했어요. 같은 주문이 이미 처리됐을 수 있으니 이전 주문 결과부터 확인해 주세요.' } };
export const Mobile: Story = { name: '모바일 · 로그인 만료', globals: { viewport: { value: 'phone375', isRotated: false } } };
