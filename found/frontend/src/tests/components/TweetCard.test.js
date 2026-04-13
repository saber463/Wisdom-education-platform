import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import TweetCard from '@/components/business/TweetCard.vue';
import { createPinia } from 'pinia';

const mockTweet = {
  _id: '1',
  content: '这是一条测试推文',
  user: {
    _id: 'user1',
    name: '测试用户',
    username: 'testuser',
  },
  createdAt: '2025-12-29T10:00:00Z',
  likes: 10,
  shares: 5,
  comments: [
    {
      _id: 'comment1',
      username: '评论用户',
      content: '这是一条评论',
      commentLikes: 2,
      createdAt: '2025-12-29T10:30:00Z',
      isLiked: false,
      replies: [],
    },
  ],
  images: [],
};

describe('TweetCard.vue', () => {
  let pinia;
  let userStore;

  beforeEach(() => {
    pinia = createPinia();

    userStore = {
      userInfo: {
        id: 'user1',
        name: '测试用户',
      },
    };

    vi.mock('@/store/user', () => ({
      useUserStore: () => userStore,
    }));
  });

  it('renders tweet content correctly', () => {
    const wrapper = mount(TweetCard, {
      global: {
        plugins: [pinia],
      },
      props: {
        tweet: mockTweet,
      },
    });

    expect(wrapper.text()).toContain('这是一条测试推文');
    expect(wrapper.text()).toContain('测试用户');
    expect(wrapper.text()).toContain('@testuser');
  });

  it('displays like count correctly', () => {
    const wrapper = mount(TweetCard, {
      global: {
        plugins: [pinia],
      },
      props: {
        tweet: mockTweet,
      },
    });

    expect(wrapper.text()).toContain('10');
  });

  it('displays comment count correctly', () => {
    const wrapper = mount(TweetCard, {
      global: {
        plugins: [pinia],
      },
      props: {
        tweet: mockTweet,
      },
    });

    expect(wrapper.text()).toContain('1');
  });

  it('shows delete button for own tweets', () => {
    const wrapper = mount(TweetCard, {
      global: {
        plugins: [pinia],
      },
      props: {
        tweet: mockTweet,
      },
    });

    const deleteButton = wrapper.find('button[title="删除推文"]');
    expect(deleteButton.exists()).toBe(true);
  });

  it('toggles comments section', async () => {
    const wrapper = mount(TweetCard, {
      global: {
        plugins: [pinia],
      },
      props: {
        tweet: mockTweet,
      },
    });

    const commentButton = wrapper.find('button[title="评论"]');
    await commentButton.trigger('click');

    expect(wrapper.vm.showComments).toBe(true);
  });
});
