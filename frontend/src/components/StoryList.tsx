import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getStoryDetails } from '../services/api';
import type { Story, StoryDetails } from '../services/api';

interface StoryListProps {
  stories: Story[];
  year: number;
}

export function StoryList({ stories, year }: StoryListProps) {
  const { t, i18n } = useTranslation();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, StoryDetails>>({});
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleToggle = async (storyId: number) => {
    if (expandedId === storyId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(storyId);

    if (!details[storyId]) {
      setLoadingId(storyId);
      try {
        const data = await getStoryDetails(storyId, year, i18n.language.split('-')[0]);
        setDetails((prev) => ({ ...prev, [storyId]: data }));
      } catch {
        // silently fail
      } finally {
        setLoadingId(null);
      }
    }
  };

  return (
    <table className="hn-story-table">
      <tbody>
        {stories.map((story, index) => (
          <StoryRow
            key={story.id}
            story={story}
            index={index}
            expanded={expandedId === story.id}
            detail={details[story.id]}
            loading={loadingId === story.id}
            onToggle={() => handleToggle(story.id)}
            t={t}
          />
        ))}
      </tbody>
    </table>
  );
}

interface StoryRowProps {
  story: Story;
  index: number;
  expanded: boolean;
  detail?: StoryDetails;
  loading: boolean;
  onToggle: () => void;
  t: (key: string) => string;
}

function StoryRow({ story, index, expanded, detail, loading, onToggle, t }: StoryRowProps) {
  return (
    <>
      <tr className="hn-story-row">
        <td className="hn-rank">{index + 1}.</td>
        <td className="hn-vote">▲</td>
        <td className="hn-story-cell">
          <div className="hn-story-title">
            <a href={story.url} className="hn-story-link" target="_blank" rel="noopener noreferrer">
              {story.title}
            </a>
            {story.domain && (
              <span className="hn-domain"> ({story.domain})</span>
            )}
          </div>
          <div className="hn-story-meta">
            {story.score} {t('points')} {t('by')} {story.author} {story.time} |{' '}
            <a href="#" className="hn-hide-link">{t('hide')}</a> |{' '}
            <a
              href="#"
              className="hn-comments-link"
              onClick={(e) => {
                e.preventDefault();
                onToggle();
              }}
            >
              {story.comments}&nbsp;{t('comments')}
            </a>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="hn-detail-row">
          <td colSpan={3}>
            <div className="hn-detail-content">
              {loading && <div className="hn-detail-loading">{t('loadingDetails')}</div>}
              {detail && (
                <>
                  <div className="hn-detail-summary">
                    <h3>{t('summary')}</h3>
                    <p>{detail.summary}</p>
                  </div>
                  {detail.comments && detail.comments.length > 0 && (
                    <div className="hn-detail-comments">
                      <h3>{t('topComments')}</h3>
                      {detail.comments.map((comment, i) => (
                        <div key={i} className="hn-comment">
                          <div className="hn-comment-meta">
                            <span className="hn-comment-author">{comment.author}</span>
                            <span className="hn-comment-time">{comment.time}</span>
                            <span className="hn-comment-score">{comment.score} {t('points')}</span>
                          </div>
                          <div className="hn-comment-text">{comment.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
