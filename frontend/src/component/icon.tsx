import { minidenticon } from 'minidenticons';
import { useMemo } from 'preact/hooks';

export const MinidenticonImg = ({
  username,
  saturation,
  lightness,
}: {
  username: string;
  saturation?: number;
  lightness?: number;
}) => {
  const svgURI = useMemo(
    () =>
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(minidenticon(username, saturation, lightness)),
    [username, saturation, lightness],
  );
  return (
    <img
      style="border-radius: 50%;"
      class="surface-dim border large"
      src={svgURI}
      alt={username}
    />
  );
};
