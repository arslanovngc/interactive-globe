import type { RefObject } from 'react';

type CountryCardProps = {
  cardRef: RefObject<HTMLElement | null>;
  countryName: string;
};

export function CountryCard({ cardRef, countryName }: CountryCardProps) {
  return (
    <article ref={cardRef} className='country-card' aria-live='polite'>
      <p className='country-card__eyebrow'>Selected country</p>
      <div className='country-card__header'>
        <h1 className='country-card__title'>{countryName}</h1>
      </div>
      <p className='country-card__summary'>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae lectus facilisis, posuere massa at,
        aliquet neque.
      </p>

      <p className='country-card__hint'>Static placeholder content.</p>
    </article>
  );
}
