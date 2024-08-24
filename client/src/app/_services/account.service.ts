import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { User } from '../_models/user';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private http = inject(HttpClient);
  baseUrl = environment.apiUrl;
  currentUser = signal<User | null>(null);

  login(model: any) {
    return this.http.post<User>(this.baseUrl + 'account/login', model).pipe(
      map(user => {
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUser.set(user);
        }
        // I added the line of code to 'return user' because otherwise, the console will return 'undefined'.
        // Neil added 'return user' to the register() below, but he didn't add it to the login().
        // When we use the map(), we're projecting something; we're transforming the response in some way.
        // We return the 'user' so that the component that is calling this method will now have access
        // to whatever is inside the 'user' object.  We're not really transforming the object in this example,
        // so the 'user' is what's inside the 'user' object.
        return user;
      })
    );
  }

  register(model: any) {
    return this.http.post<User>(this.baseUrl + 'account/register', model).pipe(
      map(user => {
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUser.set(user);
        }
        return user;
      })
    )
  }

  logout() {
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }
}
