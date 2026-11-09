import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { RecommendationNamingPreview } from './RecommendationNamingPreview';

const meta = {
  id: 'whiskey-recommendation-naming',
  title: '위스키/추천 결과 · 문구 비교',
  component: RecommendationNamingPreview,
  args: {
    naming: '오늘의 한 잔',
    information: '수집값과 확인 전 값',
    mobile: false,
    showResultLabel: false,
  },
  argTypes: {
    naming: { name: '결과 이름', options: ['오늘의 한 잔', '현재 표현', '취향을 참고해 고른 위스키', '바텐더의 제안'], control: 'select' },
    information: { name: '제품 정보 상태', options: ['수집값과 확인 전 값', '일부 정보 없음', '정보 충돌'], control: 'select' },
    mobile: { name: '모바일 너비', control: 'boolean' },
    showResultLabel: { name: '작은 결과명도 표시', control: 'boolean', description: '기본안은 실제 화면처럼 제품명을 가장 크게 표시합니다.' },
  },
  parameters: {
    docs: { description: { component: '명칭을 비교하는 고정 예시입니다. 실제 추천·로그인·DB 저장·AI 호출 없이 서비스의 기본 정보와 병입 토글 컴포넌트를 재사용합니다.' } },
  },
  render: (args) => <RecommendationNamingPreview key={args.information} {...args} />,
} satisfies Meta<typeof RecommendationNamingPreview>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Recommended: Story = { name: '권장안 · 오늘의 한 잔' };
// Comparison stories reveal the same small label so the alternative names are visible.
export const Current: Story = { name: '비교 · 현재 이름', args: { naming: '현재 표현', showResultLabel: true } };
export const TasteFirst: Story = { name: '비교 · 취향을 참고해 고른 위스키', args: { naming: '취향을 참고해 고른 위스키', showResultLabel: true } };
export const Bartender: Story = { name: '비교 · 바텐더의 제안', args: { naming: '바텐더의 제안', showResultLabel: true } };
export const MissingInformation: Story = { name: '상태 · 일부 정보 없음', args: { information: '일부 정보 없음' } };
export const ConflictingInformation: Story = { name: '상태 · 정보 충돌', args: { information: '정보 충돌' } };
export const Mobile: Story = { name: '모바일 · 권장안', args: { mobile: true }, globals: { viewport: { value: 'phone375', isRotated: false } } };
export const VisibleTitle: Story = { name: '비교 · 오늘의 한 잔', args: { showResultLabel: true } };
export const InteractionCheck: Story = {
  name: '동작 확인 · 펼치기와 첫인상',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Deanston 12 Year Old' })).toBeVisible();
    await expect(canvas.getAllByText('AI 추정')).toHaveLength(2);
    await userEvent.click(canvas.getByText('병입 정보 더보기'));
    await expect(canvas.getByText(/Bourbon/i)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: '제품 정보 다시 확인' }));
    await expect(canvas.getByText('표시할 정보에 변경이 없어요.')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: '마셔보고 싶어요' }));
    await userEvent.click(canvas.getByRole('button', { name: '이 감상 남기기' }));
    await expect(canvas.getByText('첫인상을 선택했어요. 미리보기에서는 실제로 저장하지 않아요.')).toBeVisible();
  },
};
