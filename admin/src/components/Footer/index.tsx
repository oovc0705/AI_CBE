import { createStyles } from 'antd-style';
import React from 'react';

const COMMIT_HASH = process.env.COMMIT_HASH || '';

const useStyles = createStyles(({ token, css }) => ({
  footer: css`
    padding: 12px 24px;
    text-align: center;
    color: ${token.colorTextDescription};
    font-size: ${token.fontSizeSM}px;
    line-height: ${token.lineHeight};
    background: transparent;
  `,
  meta: css`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 4px 12px;
    font-size: ${token.fontSizeSM - 1}px;
  `,
  label: css`
    color: ${token.colorTextQuaternary};
  `,
}));

const Footer: React.FC = () => {
  const { styles } = useStyles();
  const year = new Date().getFullYear();

  return (
    <div className={styles.footer}>
      <div className={styles.meta}>
        <span>
          CBE-Admin &copy; {year}
        </span>
        <span>
          <span className={styles.label}>v</span>
          {__APP_VERSION__}
          {COMMIT_HASH && ` (${COMMIT_HASH.slice(0, 7)})`}
        </span>
      </div>
    </div>
  );
};

export default Footer;
