import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  content: string
}

export function MarkdownRenderer({ content }: Props) {
  return (
    <div className="prose-colossus max-w-none text-sm leading-relaxed space-y-3
      [&_h1]:text-text [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:pb-2 [&_h1]:border-b [&_h1]:border-border
      [&_h2]:text-text [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:pb-1 [&_h2]:border-b [&_h2]:border-border
      [&_h3]:text-text [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
      [&_p]:text-text-muted [&_p]:leading-relaxed [&_p]:mb-2
      [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul]:space-y-1
      [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_ol]:space-y-1
      [&_li>p]:mb-0
      [&_code]:bg-surface-alt [&_code]:text-accent [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
      [&_pre]:bg-[oklch(0.04_0_0)] [&_pre]:border [&_pre]:border-border [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:mb-4 [&_pre]:overflow-x-auto
      [&_pre>code]:bg-transparent [&_pre>code]:text-text-muted [&_pre>code]:text-xs [&_pre>code]:leading-relaxed [&_pre>code]:p-0
      [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:text-text-dim [&_blockquote]:italic [&_blockquote]:mb-3
      [&_hr]:border-border [&_hr]:my-4
      [&_a]:text-info [&_a]:hover:underline [&_a]:underline-offset-2
      [&_img]:rounded-lg [&_img]:border [&_img]:border-border [&_img]:max-w-full [&_img]:my-3
      [&_table]:w-full [&_table]:border-collapse [&_table]:mb-4
      [&_th]:bg-surface-alt [&_th]:text-text [&_th]:font-semibold [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:border [&_th]:border-border [&_th]:text-xs
      [&_td]:px-3 [&_td]:py-2 [&_td]:border [&_td]:border-border [&_td]:text-sm
      [&_tr:nth-child(even)]:bg-surface
      [&_input[type=checkbox]]:accent-accent [&_input[type=checkbox]]:mr-2
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
