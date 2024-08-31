import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Member } from '../_models/member';
import { environment } from '../../environments/environment';
import { Photo } from '../_models/photo';
import { PaginatedResult } from '../_models/pagination';
import { UserParams } from '../_models/userParams';
import { of } from 'rxjs';
import { AccountService } from './account.service';

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  private http = inject(HttpClient);
  private accountService = inject(AccountService);
  baseUrl = environment.apiUrl;
  paginatedResult = signal<PaginatedResult<Member[]> | null>(null);

  /*
      A Map() allows me to get and set values inside it.  I'll store the 'response' that I get
      from the 'userParams' being sent up to the API in 'getMembers()'.  The Map() object will
      store key:value pairs.  The 'Object.values(userParams).join('-')' serves as the key.  When
      a request comes in with a given key, I'll use the key to get the corresponding response
      from the 'memberCache'.

      An example of a response is '18-99-1-5-lastActive-male'.  These are the values that form
      the query string to return and display a page that will have these parameters (minAge,
      maxAge, pageNumber, pageSize, orderBy, gender) for the members, the filters, the sorting,
      and the requested pagination.  If I cache these values in the 'memberCache', then I can
      just refer to the memberCache if I need to display the same page again (rather than going
      to the API again for a page that has already been requested earlier).

      If there's a 'response', then I update my paginatedResult() signal.  The client component
      will be listening to the signal, so the client component will update when the signal
      is updated.  Every time the user makes a request, the signal will be updated and the
      response will be stored inside the memberCache.
  */

  memberCache = new Map();

  /*
      Here's an example of a signal that has two way binding.  The 'userParams' is a signal
      of type <UserParams>.  It starts with an initial value of 'new UserParams()'.
      This allows the app to remember the user parameters.

      For example, if a user changes the age range, changes the gender, and applies the filters,
      the user will see the filtered, sorted, paginated results on the Matches page.
      If the user now clicks on another component (i.e. the Messages tab), the app will take
      the user to the Messages component, which will show the Messages page.  Now, if the user
      clicks on the 'Matches' tab, the user will be taken back to the Matches page,
      and the sorting, filtering, and pagination (that the user just recently applied)
      will still be displayed on the Matches tab.
  */

  user = this.accountService.currentUser();
  userParams = signal<UserParams>(new UserParams(this.user));

  resetUserParams() {
    this.userParams.set(new UserParams(this.user));
  }

  getMembers() {
    const response = this.memberCache.get(Object.values(this.userParams()).join('-'));

    if (response) return this.setPaginatedResponse(response);

    // console.log(Object.values(userParams).join('-'));

    let params = this.setPaginationHeaders(this.userParams().pageNumber, this.userParams().pageSize);

    params = params.append('minAge', this.userParams().minAge);
    params = params.append('maxAge', this.userParams().maxAge);
    params = params.append('gender', this.userParams().gender);
    params = params.append('orderBy', this.userParams().orderBy);

    return this.http.get<Member[]>(this.baseUrl + 'users', {observe: 'response', params}).subscribe({
      next: response => {
        this.setPaginatedResponse(response);
        this.memberCache.set(Object.values(this.userParams()).join('-'), response);
      }
    })
  }

  private setPaginatedResponse(response: HttpResponse<Member[]>) {
    this.paginatedResult.set({
      items: response.body as Member[],
      pagination: JSON.parse(response.headers.get('Pagination')!)
    })
  }

  private setPaginationHeaders(pageNumber: number, pageSize: number) {
    let params = new HttpParams();

    if (pageNumber && pageSize) {
      params = params.append('pageNumber', pageNumber);
      params = params.append('pageSize', pageSize);
    }

    return params;
  }

  getMember(username: string) {
    const member: Member = [...this.memberCache.values()]
      .reduce((arr, elem) => arr.concat(elem.body), [])
      .find((m: Member) => m.username === username);

      if (member) return of(member);

    return this.http.get<Member>(this.baseUrl + 'users/' + username);
  }

  updateMember(member: Member) {
    return this.http.put(this.baseUrl + 'users', member).pipe(
      // tap( () => {
      //   this.members.update(members => members.map(m => m.username === member.username
      //     ? member : m))
      // })
    )
  }

  setMainPhoto(photo: Photo) {
    return this.http.put(this.baseUrl + 'users/set-main-photo/' + photo.id, {}).pipe(
      // tap(() => {
      //   this.members.update(members => members.map(m => {
      //     if (m.photos.includes(photo)) {
      //       m.photoUrl = photo.url
      //     }
      //     return m;
      //   }))
      // })
    )
  }

  deletePhoto(photo: Photo) {
    return this.http.delete(this.baseUrl + 'users/delete-photo/' + photo.id).pipe(
      // tap(() => {
      //   this.members.update(members => members.map(m => {
      //     if (m.photos.includes(photo)) {
      //       m.photos = m.photos.filter(x => x.id !== photo.id)
      //     }
      //     return m
      //   }))
      // })
    )
  }
}
