import type { Car, Comment, Post, Profile } from '../types/domain'

export const profiles: Profile[] = [
  {
    id: 'p1',
    username: 'rafa.turbo',
    displayName: 'Rafael Souza',
    type: 'piloto',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    bio: 'Civic EG turbo. Rodando drift nos fins de semana.',
    location: 'Curitiba, PR',
    followersCount: 1840,
    followingCount: 320,
    carsCount: 1,
  },
  {
    id: 'p2',
    username: 'garagem.norte',
    displayName: 'Garagem Norte Preparações',
    type: 'oficina',
    avatarUrl: 'https://i.pravatar.cc/150?img=32',
    bio: 'Turbo, suspensão e dyno. Agende sua avaliação.',
    location: 'São Paulo, SP',
    followersCount: 9600,
    followingCount: 40,
    carsCount: 18,
    verified: true,
    specialties: ['Turbo', 'Suspensão', 'Dyno'],
  },
  {
    id: 'p3',
    username: 'bia.4x4',
    displayName: 'Bianca Ferreira',
    type: 'piloto',
    avatarUrl: 'https://i.pravatar.cc/150?img=47',
    bio: 'Troller preparado pra trilha pesada.',
    location: 'Goiânia, GO',
    followersCount: 640,
    followingCount: 210,
    carsCount: 1,
  },
]

export const cars: Car[] = [
  {
    id: 'c1',
    ownerId: 'p1',
    name: 'EG Turbo Project',
    brand: 'Honda',
    model: 'Civic EG',
    year: 1995,
    coverPhotoUrl:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
    spec: {
      drivetrain: 'dianteira',
      aspiration: 'turbo',
      suspension: 'coilover',
      wheels: 'Work Emotion 17"',
      tires: 'Federal RS-RR 225/45',
      hp: 420,
      whp: 365,
    },
    buildStage: 'pronto para pista',
  },
  {
    id: 'c2',
    ownerId: 'p3',
    name: 'Troller Trilheiro',
    brand: 'Troller',
    model: 'T4',
    year: 2020,
    coverPhotoUrl:
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
    spec: {
      drivetrain: '4x4',
      aspiration: 'turbo',
      suspension: 'competição',
      wheels: 'Aro 15 Beadlock',
      tires: 'BF Goodrich KM3 33"',
      hp: 200,
      whp: 175,
    },
    buildStage: 'pronto para pista',
  },
]

export const posts: Post[] = [
  {
    id: 'post1',
    authorId: 'p1',
    carId: 'c1',
    photoUrls: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80',
    ],
    caption: 'Setup novo de suspensão instalado. 365whp no rolo essa semana 🔥',
    createdAt: '2026-08-30T18:20:00Z',
    likesCount: 284,
    commentsCount: 12,
    likedByMe: false,
  },
  {
    id: 'post2',
    authorId: 'p2',
    carId: 'c1',
    photoUrls: [
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=80',
    ],
    caption: 'Mais um turbo kit saindo da oficina. Manda o seu carro pra avaliação!',
    createdAt: '2026-08-29T14:05:00Z',
    likesCount: 512,
    commentsCount: 34,
    likedByMe: true,
  },
  {
    id: 'post3',
    authorId: 'p3',
    carId: 'c2',
    photoUrls: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80',
    ],
    caption: 'Trilha do fim de semana. Beadlock aguentou tudo.',
    createdAt: '2026-08-28T09:40:00Z',
    likesCount: 190,
    commentsCount: 8,
    likedByMe: false,
  },
]

export const comments: Comment[] = [
  { id: 'cm1', postId: 'post1', authorId: 'p3', text: 'Ficou insano!', createdAt: '2026-08-30T19:00:00Z' },
  { id: 'cm2', postId: 'post1', authorId: 'p2', text: 'Manda pra avaliar no dyno essa semana', createdAt: '2026-08-30T20:10:00Z' },
]

export const currentUserId = 'p1'
