import { Article } from './article.model';
import { Comment } from './comment.model';

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  bio: string | null;
  image: any | null;
  articles: Article[];
  favorites: Article[];
  followers: User[];
  following: User[];
  comments: Comment[];
}
