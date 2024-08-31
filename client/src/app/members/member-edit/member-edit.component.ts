import { Component, HostListener, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { Member } from '../../_models/member';
import { AccountService } from '../../_services/account.service';
import { MembersService } from '../../_services/members.service';
import { ToastrService } from 'ngx-toastr';
import { PhotoEditorComponent } from "../photo-editor/photo-editor.component";
import { DatePipe } from '@angular/common';
import { TimeagoModule } from 'ngx-timeago';

@Component({
  selector: 'app-member-edit',
  standalone: true,
  imports: [TabsModule, FormsModule, PhotoEditorComponent, DatePipe, TimeagoModule],
  templateUrl: './member-edit.component.html',
  styleUrl: './member-edit.component.css'
})

/*  The HTML template is considered a child of the component.  To access a template reference
    variable (i.e. 'editForm'), I use an Angular feature called '@ViewChild'.  I then assign
    it to a variable so I can use the variable inside the component.  In this example, I name
    the variable 'editForm' and I give it a type of 'ngForm'.  I make the variable optional
    because the view (the template) won't be available when the component is first constructed.
    When the component is initialized, the component is initialized first, and then the view
    is initialized.  The view is the template.  It will be undefined when the component
    is first instantiated.  */

export class MemberEditComponent implements OnInit {
  @ViewChild('editForm') editForm?: NgForm;
  @HostListener('window:beforeunload', ['$event']) notify($event:any) {
    if (this.editForm?.dirty) {
      $event.returnValue = true;
    }
  }

  member?: Member;
  private accountService = inject(AccountService);
  private memberService = inject(MembersService);
  private toastr = inject(ToastrService);

  ngOnInit(): void {
    this.loadMember();
  }

  loadMember() {
    const user = this.accountService.currentUser();
    if (!user) return;
    this.memberService.getMember(user.username).subscribe({
      next: member => this.member = member
    })
  }

  updateMember() {
    this.memberService.updateMember(this.editForm?.value).subscribe({
      next: _ => {
        this.toastr.success('Profile was successfully updated');
        /*  Once I've submitted the form with the changes, and the changes are saved, the 'member'
            will be updated, and I need to reset the form to the values that are now contained
            in 'this.member', which will include the values that were just saved.  */
            this.editForm?.reset(this.member);
      }
    })
  }

  onMemberChange(event: Member) {
    this.member = event;
  }

}
