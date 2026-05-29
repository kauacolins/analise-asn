type ApiStatusProps = {
  message: string;
};

export function ApiStatus({ message }: ApiStatusProps) {
  return (
    <section className="panel panel-body">
      <div className="threat-badge threat-critical mb-4 w-fit normal-case tracking-normal">
        API indisponível
      </div>
      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{message}</p>
    </section>
  );
}
