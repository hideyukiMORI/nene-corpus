import { nc } from '@nene-corpus/tokens';

export function EmbedWidget() {
  return (
    <div className={nc.widgetRoot}>
      <section className={nc.chatPanel} aria-label="NeNe Corpus chat">
        <div className={nc.chatBubble}>Ask a question about our products.</div>
        <form
          className={nc.chatForm}
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <input
            className={nc.chatInput}
            type="text"
            placeholder="Type your question…"
            aria-label="Chat message"
          />
          <button className={nc.chatSubmit} type="submit">
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
