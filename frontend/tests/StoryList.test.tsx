import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StoryList } from '../src/components/StoryList';
import * as api from '../src/services/api';

vi.mock('../src/i18n', () => ({}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const m: Record<string, string> = {
        points: 'points', by: 'by', comments: 'comments', hide: 'hide',
        loadingDetails: 'Loading details...', summary: 'Summary',
        topComments: 'Top Comments',
      };
      return m[key] || key;
    },
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

const mockStories = [
  { id: 1, title: 'Story One', url: 'https://one.com', domain: 'one.com', score: 200, author: 'alice', time: '1h ago', comments: 50 },
  { id: 2, title: 'Story Two', url: 'https://two.com', domain: 'two.com', score: 150, author: 'bob', time: '2h ago', comments: 30 },
];

describe('StoryList', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders stories with ranks', () => {
    render(<StoryList stories={mockStories} year={2035} />);
    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('2.')).toBeInTheDocument();
    expect(screen.getByText('Story One')).toBeInTheDocument();
    expect(screen.getByText('Story Two')).toBeInTheDocument();
  });

  it('shows story metadata', () => {
    render(<StoryList stories={mockStories} year={2035} />);
    expect(screen.getByText(/200/)).toBeInTheDocument();
    expect(screen.getByText(/alice/)).toBeInTheDocument();
    expect(screen.getByText('(one.com)')).toBeInTheDocument();
  });

  it('expands story details on click', async () => {
    const mockDetails = {
      story_id: 1,
      summary: 'Detailed summary here',
      comments: [{ author: 'commenter', text: 'Great post!', score: 10, time: '30m ago' }],
    };

    vi.spyOn(api, 'getStoryDetails').mockResolvedValue(mockDetails);

    render(<StoryList stories={mockStories} year={2035} />);

    // Click on comments link for first story
    const commentLinks = screen.getAllByText(/comments/);
    fireEvent.click(commentLinks[0]);

    await waitFor(() => {
      expect(screen.getByText('Detailed summary here')).toBeInTheDocument();
    });
    expect(screen.getByText('Great post!')).toBeInTheDocument();
  });

  it('collapses details on second click', async () => {
    const mockDetails = {
      story_id: 1,
      summary: 'Summary text',
      comments: [],
    };

    vi.spyOn(api, 'getStoryDetails').mockResolvedValue(mockDetails);

    render(<StoryList stories={mockStories} year={2035} />);

    const commentLinks = screen.getAllByText(/comments/);
    fireEvent.click(commentLinks[0]);

    await waitFor(() => {
      expect(screen.getByText('Summary text')).toBeInTheDocument();
    });

    // Click again to collapse
    fireEvent.click(commentLinks[0]);
    expect(screen.queryByText('Summary text')).not.toBeInTheDocument();
  });

  it('shows loading state while fetching details', async () => {
    let resolvePromise: (value: api.StoryDetails) => void;
    const promise = new Promise<api.StoryDetails>((resolve) => {
      resolvePromise = resolve;
    });

    vi.spyOn(api, 'getStoryDetails').mockReturnValue(promise);

    render(<StoryList stories={mockStories} year={2035} />);

    const commentLinks = screen.getAllByText(/comments/);
    fireEvent.click(commentLinks[0]);

    expect(screen.getByText('Loading details...')).toBeInTheDocument();

    resolvePromise!({ story_id: 1, summary: 'Done', comments: [] });
    await waitFor(() => {
      expect(screen.queryByText('Loading details...')).not.toBeInTheDocument();
    });
  });

  it('handles failed detail fetch gracefully', async () => {
    vi.spyOn(api, 'getStoryDetails').mockRejectedValue(new Error('fail'));

    render(<StoryList stories={mockStories} year={2035} />);

    const commentLinks = screen.getAllByText(/comments/);
    fireEvent.click(commentLinks[0]);

    // Should not crash - just no details shown
    await waitFor(() => {
      expect(screen.queryByText('Loading details...')).not.toBeInTheDocument();
    });
  });

  it('caches details and reuses on re-expand', async () => {
    const mockDetails = {
      story_id: 1,
      summary: 'Cached summary',
      comments: [],
    };

    const spy = vi.spyOn(api, 'getStoryDetails').mockResolvedValue(mockDetails);

    render(<StoryList stories={mockStories} year={2035} />);

    const commentLinks = screen.getAllByText(/comments/);

    // First click
    fireEvent.click(commentLinks[0]);
    await waitFor(() => {
      expect(screen.getByText('Cached summary')).toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledTimes(1);

    // Collapse
    fireEvent.click(commentLinks[0]);

    // Re-expand - should use cache
    fireEvent.click(commentLinks[0]);
    await waitFor(() => {
      expect(screen.getByText('Cached summary')).toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledTimes(1); // Not called again
  });

  it('renders story links with target blank', () => {
    render(<StoryList stories={mockStories} year={2035} />);
    const link = screen.getByText('Story One').closest('a');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('href', 'https://one.com');
  });
});
